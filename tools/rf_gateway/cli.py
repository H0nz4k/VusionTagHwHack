#!/usr/bin/env python3
"""ovh-rf CLI. Hardware probe fails honestly if CC2500 is absent."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import protocol as proto
from cc2500 import Cc2500, MARC_NAMES, rssi_to_dbm
from radio_profile import PROFILE_NAME, REGISTERS
from transport import MockSpi, hardware_spi_available, load_config, open_hardware_spi


def _chip(args) -> Cc2500:
    if args.dry_run:
        return Cc2500(MockSpi())
    if not hardware_spi_available():
        raise SystemExit("CC2500 probe: no /dev/spidev* — hardware not present")
    cfg = load_config(args.config)
    return Cc2500(open_hardware_spi(cfg))


def cmd_probe(args) -> int:
    c = _chip(args)
    if not args.dry_run:
        c.reset()
    pn, ver, marc = c.partnum(), c.version(), c.marcstate()
    rec = {
        "event": "probe",
        "dry_run": bool(args.dry_run),
        "partnum": pn,
        "version": ver,
        "marcstate": marc,
        "marc_name": MARC_NAMES.get(marc, "?"),
        "profile": PROFILE_NAME,
    }
    print(json.dumps(rec) if args.trace else rec)
    if args.dry_run:
        print("DRY-RUN: mock PARTNUM, not over-the-air")
    return 0


def cmd_regdump(args) -> int:
    c = _chip(args)
    for name, val in REGISTERS.items():
        print(f"{name}={val:02X}")
    if not args.dry_run:
        c.reset()
        print(f"PARTNUM={c.partnum():02X} VERSION={c.version():02X} MARC={c.marcstate():02X}")
    return 0


def cmd_rssi(args) -> int:
    if not args.dry_run:
        raise SystemExit("rssi requires CC2500 hardware; use --dry-run only to test CLI")
    print("DRY-RUN: no RSSI samples")
    return 0


def cmd_tx_ping(args) -> int:
    frame = proto.encode_ping(proto.ID_DEV_TAG, proto.ID_GATEWAY, args.seq, b"OV")
    print(f"PDU hex={frame.hex()} len={len(frame)} count={args.count}")
    if args.dry_run:
        print("DRY-RUN: not transmitted")
        return 0
    raise SystemExit("tx-ping requires CC2500 hardware")


def cmd_ping(args) -> int:
    return cmd_tx_ping(args)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="ovh-rf")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--verbose", action="store_true")
    p.add_argument("--trace", action="store_true")
    p.add_argument("--config", default=None)
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("probe").set_defaults(func=cmd_probe)
    sub.add_parser("regdump").set_defaults(func=cmd_regdump)
    rs = sub.add_parser("rssi")
    rs.add_argument("--seconds", type=int, default=5)
    rs.set_defaults(func=cmd_rssi)
    rx = sub.add_parser("rx")
    rx.add_argument("--seconds", type=int, default=10)
    rx.set_defaults(func=cmd_rssi)
    tx = sub.add_parser("tx-ping")
    tx.add_argument("--count", type=int, default=3)
    tx.add_argument("--seq", type=int, default=1)
    tx.set_defaults(func=cmd_tx_ping)
    pg = sub.add_parser("ping")
    pg.add_argument("--tag", type=int, default=1)
    pg.add_argument("--count", type=int, default=3)
    pg.add_argument("--seq", type=int, default=1)
    pg.set_defaults(func=cmd_ping)
    st = sub.add_parser("status")
    st.add_argument("--tag", type=int, default=1)
    st.set_defaults(func=lambda a: 0)

    args = p.parse_args(argv)
    return int(args.func(args) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
