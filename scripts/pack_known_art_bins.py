#!/usr/bin/env python3
"""Pack known-good GU140 artwork into 11248 B TagStudio-layout BINs."""
from __future__ import annotations

import binascii
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "captures" / "nfc" / "art"
PLANE = 5624


def parse_c_array(text: str, name: str) -> bytes:
    m = re.search(
        rf"const unsigned char {re.escape(name)}\[\d+\] = \{{(.*?)\}};",
        text,
        re.S,
    )
    if not m:
        raise SystemExit(f"missing array {name}")
    vals = [int(x, 16) for x in re.findall(r"0x([0-9a-fA-F]{2})", m.group(1))]
    return bytes(vals)


def decode_rle(raw: bytes, expect: int = PLANE) -> bytes:
    out = bytearray()
    i = 0
    while i + 1 < len(raw) and len(out) < expect:
        n = raw[i]
        v = raw[i + 1]
        i += 2
        if n == 0:
            raise SystemExit("RLE count 0")
        out.extend(bytes([v]) * n)
    if len(out) != expect:
        raise SystemExit(f"RLE size {len(out)} != {expect}")
    return bytes(out)


def write_bin(name: str, p10: bytes, p13: bytes) -> Path:
    if len(p10) != PLANE or len(p13) != PLANE:
        raise SystemExit(f"{name} plane size")
    blob = p10 + p13
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_bytes(blob)
    crc = binascii.crc32(blob) & 0xFFFFFFFF
    print(f"{path.name} {len(blob)} crc={crc:08X} p10ones={sum(bin(b).count('1') for b in p10)} p13ones={sum(bin(b).count('1') for b in p13)}")
    return path


def main() -> None:
    ov = (ROOT / "firmware/OpenVusion26_GU140_FW_UART_DIAG/v0.4l_ovhack/img_ovhack.c").read_text(
        encoding="ascii"
    )
    write_bin("ovhack.bin", parse_c_array(ov, "img_p10"), parse_c_array(ov, "img_p13"))

    rle = (
        ROOT / "firmware/OpenVusion26_GU140_FW_UART_DIAG/v0.10e_nfc_show3/img_rle.c"
    ).read_text(encoding="ascii")
    write_bin(
        "money.bin",
        decode_rle(parse_c_array(rle, "su_rle10")),
        decode_rle(parse_c_array(rle, "su_rle13")),
    )


if __name__ == "__main__":
    main()
