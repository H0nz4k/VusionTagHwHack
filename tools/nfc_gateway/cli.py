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
    p_watch.set_defaults(func=cmd_field_watch)
    args = p.parse_args(argv)
    return int(args.func(args) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
