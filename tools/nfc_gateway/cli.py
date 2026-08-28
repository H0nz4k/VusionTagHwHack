#!/usr/bin/env python3
"""ovh-nfc — TWN4 on /dev/ttyACM0 only. Never ttyUSB0 (CP2102 UART)."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ELATEC_SRC = Path(__file__).resolve().parents[1] / "ElaTool" / "src"
if str(ELATEC_SRC) not in sys.path:
    sys.path.insert(0, str(ELATEC_SRC))

TWN4_DEFAULT = "/dev/ttyACM0"
FORBIDDEN = ("/dev/ttyUSB0",)

NTAG_PLUS_1K = bytes.fromhex("00 04 04 05 02 02 13 03")


def _port(args) -> str:
    p = args.port
    if p in FORBIDDEN or p.endswith("ttyUSB0"):
        raise SystemExit("Refusing CP2102 UART port. Use /dev/ttyACM0 for TWN4.")
    return p


def cmd_reader_info(args) -> int:
    from elatec_uid_tool.protocol import SimpleProtocolClient

    port = _port(args)
    rec = {"event": "reader_info", "port": port}
    try:
        with SimpleProtocolClient(port, timeout=args.timeout) as client:
            info = client.read_info()
            rec["reader"] = info.version
            rec["device_type"] = info.device_type
            rec["lf_mask"] = info.lf_supported_mask
            rec["hf_mask"] = info.hf_supported_mask
    except Exception as e:
        rec["error"] = str(e)
        print(json.dumps(rec, default=str))
        return 1
    print(json.dumps(rec, default=str))
    return 0


def cmd_probe(args) -> int:
    from elatec_uid_tool.protocol import ElatecError, SimpleProtocolClient
    from elatec_uid_tool.ntag import NtagI2CPlus

    port = _port(args)
    rec = {"event": "nfc_probe", "port": port, "tag": None, "version": None}
    try:
        with SimpleProtocolClient(port, timeout=args.timeout) as client:
            info = client.read_info()
            rec["reader"] = info.version
            rec["device_type"] = info.device_type
            client.set_tag_types(info.lf_supported_mask, info.hf_supported_mask)
            deadline = time.monotonic() + args.wait
            tag = None
            while time.monotonic() < deadline:
                tag = client.search_tag()
                if tag is not None:
                    break
                time.sleep(0.12)
            if tag is None:
                rec["error"] = "no_tag"
                try:
                    client.set_rf_off()
                except ElatecError:
                    pass
                print(json.dumps(rec, default=str))
                return 2
            rec["tag"] = {
                "uid": tag.id_hex,
                "type": tag.tag_type,
                "bits": tag.id_bit_count,
            }
            ntag = NtagI2CPlus(client)
            ver = ntag.get_version()
            rec["version"] = ver.raw.hex(" ").upper()
            rec["ntag_i2c_plus_1k"] = ver.is_ntag_i2c_plus_1k
            try:
                client.set_rf_off()
            except ElatecError:
                pass
    except Exception as e:
        rec["error"] = str(e)
        print(json.dumps(rec, default=str))
        return 1
    print(json.dumps(rec, default=str))
    return 0 if rec.get("ntag_i2c_plus_1k") else 4


def cmd_field_watch(args) -> int:
    """Hold TWN4 RF and report ISO14443 presence. Bounded by --wait. Never ttyUSB0."""
    from elatec_uid_tool.protocol import ElatecError, SimpleProtocolClient

    port = _port(args)
    hits = 0
    last = None
    try:
        with SimpleProtocolClient(port, timeout=args.timeout) as client:
            info = client.read_info()
            print(
                json.dumps(
                    {
                        "event": "field_watch_start",
                        "port": port,
                        "reader": info.version,
                        "wait_s": args.wait,
                        "until_hit": bool(getattr(args, "until_hit", False)),
                    }
                ),
                flush=True,
            )
            client.set_tag_types(info.lf_supported_mask, info.hf_supported_mask)
            deadline = time.monotonic() + args.wait
            while time.monotonic() < deadline:
                tag = client.search_tag()
                in_field = tag is not None
                uid = tag.id_hex if tag is not None else None
                rec = {"event": "field", "in_field": in_field, "uid": uid}
                if rec != last:
                    print(json.dumps(rec), flush=True)
                    last = rec
                if in_field:
                    hits += 1
                    if getattr(args, "until_hit", False):
                        break
                time.sleep(0.15)
            try:
                client.set_rf_off()
            except ElatecError:
                pass
    except Exception as e:
        print(json.dumps({"event": "field_watch_error", "error": str(e)}))
        return 1
    print(json.dumps({"event": "field_watch_end", "hits": hits}))
    return 0 if hits else 2


SHOW_RF_PAGE = 0x30
SHOW_MAGIC = b"OVH"


def _select_ntag(client, wait_s: float):
    from elatec_uid_tool.ntag import NtagI2CPlus

    info = client.read_info()
    client.set_tag_types(info.lf_supported_mask, info.hf_supported_mask)
    deadline = time.monotonic() + wait_s
    tag = None
    while time.monotonic() < deadline:
        tag = client.search_tag()
        if tag is not None:
            break
        time.sleep(0.12)
    if tag is None:
        return info, None, None
    return info, tag, NtagI2CPlus(client)


def cmd_peek(args) -> int:
    """READ lock/CC/user/config pages. No WRITE. Bounded --wait."""
    from elatec_uid_tool.protocol import ElatecError, SimpleProtocolClient

    port = _port(args)
    rec = {"event": "nfc_peek", "port": port}
    try:
        with SimpleProtocolClient(port, timeout=args.timeout) as client:
            info, tag, ntag = _select_ntag(client, args.wait)
            rec["reader"] = info.version
            if tag is None:
                rec["error"] = "no_tag"
                try:
                    client.set_rf_off()
                except ElatecError:
                    pass
                print(json.dumps(rec, default=str))
                return 2
            rec["uid"] = tag.id_hex
            rec["version"] = ntag.get_version().raw.hex(" ").upper()
            try:
                sess = ntag.read_session_registers()
                rec["session"] = {
                    "raw": sess.hex(" ").upper(),
                    "NC_REG": sess[0],
                    "LAST_NDEF_BLOCK": sess[1],
                    "SRAM_MIRROR_BLOCK": sess[2],
                    "NS_REG": sess[6],
                }
            except Exception as e:
                rec["session"] = f"ERR {e}"
            try:
                rec["config_E8"] = {
                    f"{k:02X}": v.hex(" ").upper()
                    for k, v in ntag.read_configuration_registers().items()
                }
            except Exception as e:
                rec["config_E8"] = f"ERR {e}"
            pages = {}
            for pg in (0x00, 0x02, 0x03, 0x04, 0x05, 0x06, 0x10, 0x30, 0xE2, 0xE3, 0xE8, 0xE9):
                try:
                    pages[f"{pg:02X}"] = ntag.read_page(pg).hex(" ").upper()
                except Exception as e:
                    pages[f"{pg:02X}"] = f"ERR {e}"
            rec["pages"] = pages
            try:
                client.set_rf_off()
            except ElatecError:
                pass
    except Exception as e:
        rec["error"] = str(e)
        print(json.dumps(rec, default=str))
        return 1
    print(json.dumps(rec, default=str))
    return 0


def cmd_show(args) -> int:
    """WRITE variant 1/2/3/4 to NTAG user page 0x30, hold RF briefly, then off."""
    from elatec_uid_tool.protocol import ElatecError, SimpleProtocolClient
    from elatec_uid_tool.ntag import NtagI2CPlus

    port = _port(args)
    variant = int(args.variant)
    rec = {"event": "nfc_show", "port": port, "variant": variant, "page": SHOW_RF_PAGE}
    try:
        with SimpleProtocolClient(port, timeout=args.timeout) as client:
            info = client.read_info()
            rec["reader"] = info.version
            client.set_tag_types(info.lf_supported_mask, info.hf_supported_mask)
            print(
                f"Přilož TWN4 na tag. Čekám až {args.wait:.0f} s (volba {variant})…",
                flush=True,
            )
            deadline = time.monotonic() + args.wait
            tag = None
            last_left = None
            while time.monotonic() < deadline:
                tag = client.search_tag()
                if tag is not None:
                    break
                left = int(deadline - time.monotonic())
                if left != last_left:
                    print(f"  čekám na tag… {left} s", flush=True)
                    last_left = left
                time.sleep(0.15)
            if tag is None:
                rec["error"] = "no_tag"
                try:
                    client.set_rf_off()
                except ElatecError:
                    pass
                print("Tag se v limitu neobjevil.", flush=True)
                print(json.dumps(rec, default=str))
                return 2
            print(f"Tag {tag.id_hex} — zapisuji {variant}…", flush=True)
            rec["uid"] = tag.id_hex
            ntag = NtagI2CPlus(client)
            ntag.get_version()
            pack = ntag.pwd_auth(bytes.fromhex("FFFFFFFF"))
            rec["pack"] = pack.hex(" ").upper()
            rec["auth"] = "factory_ffffffff"
            ntag.write_page(SHOW_RF_PAGE, SHOW_MAGIC + bytes([variant]))
            rec["page30"] = ntag.read_page(SHOW_RF_PAGE).hex(" ").upper()
            rec["written"] = True
            print(json.dumps(rec, default=str), flush=True)
            time.sleep(0.35)
            try:
                client.set_rf_off()
            except ElatecError:
                pass
    except Exception as e:
        rec["error"] = str(e)
        rec["written"] = False
        print(json.dumps(rec, default=str))
        return 1
    print(json.dumps({"event": "nfc_show_done", "variant": variant, "leave_when_led_off": True}))
    return 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="ovh-nfc")
    p.add_argument("--port", default=TWN4_DEFAULT)
    p.add_argument("--timeout", type=float, default=1.5)
    sub = p.add_subparsers(dest="cmd", required=True)
    p_info = sub.add_parser("reader-info")
    p_info.set_defaults(func=cmd_reader_info)
    p_probe = sub.add_parser("probe")
    p_probe.add_argument("--wait", type=float, default=8.0)
    p_probe.set_defaults(func=cmd_probe)
    p_watch = sub.add_parser("field-watch")
    p_watch.add_argument("--wait", type=float, default=45.0)
    p_watch.add_argument(
        "--until-hit",
        action="store_true",
        help="Exit on first in_field (still bounded by --wait).",
    )
    p_watch.set_defaults(func=cmd_field_watch)
    p_show = sub.add_parser("show")
    p_show.add_argument("variant", type=int, choices=(1, 2, 3, 4))
    p_show.add_argument("--wait", type=float, default=45.0)
    p_show.set_defaults(func=cmd_show)
    p_peek = sub.add_parser("peek")
    p_peek.add_argument("--wait", type=float, default=20.0)
    p_peek.set_defaults(func=cmd_peek)
    args = p.parse_args(argv)
    return int(args.func(args) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
