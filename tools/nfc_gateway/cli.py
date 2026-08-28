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
    args = p.parse_args(argv)
    return int(args.func(args) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
