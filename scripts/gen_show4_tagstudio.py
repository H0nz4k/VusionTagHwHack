#!/usr/bin/env python3
"""TagStudio BIN/C (296x152 A-then-B) -> native 152x296 p10/p13 for SHOW slot 4."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from gen_nfc_show_bwr import (  # noqa: E402
    CAP,
    LAND_H,
    LAND_W,
    NATIVE_H,
    NATIVE_W,
    UART,
    landscape_to_native,
    pack_native,
    write_img_c,
)

PLANE = 5624
ROW_A = LAND_W // 8  # 37
SRC_BIN = (
    ROOT
    / "tools"
    / "TagStudio"
    / "testPIC"
    / "orignal_pic"
    / "new"
    / "tagstudio_EDG2-0260-A_296x152.bin"
)
SRC_C = SRC_BIN.with_suffix(".c")


def load_ab() -> tuple[bytes, bytes]:
    if SRC_BIN.exists():
        blob = SRC_BIN.read_bytes()
    else:
        nums = [
            int(x, 16)
            for x in re.findall(r"0x([0-9a-fA-F]{2})", SRC_C.read_text(encoding="ascii"))
        ]
        blob = bytes(nums[: 2 * PLANE])
    if len(blob) < 2 * PLANE:
        raise SystemExit(f"TagStudio blob too short: {len(blob)}")
    return blob[:PLANE], blob[PLANE : 2 * PLANE]


def bit_at(plane: bytes, x: int, y: int) -> int:
    idx = y * ROW_A + (x // 8)
    mask = 1 << (7 - (x % 8))
    return 1 if plane[idx] & mask else 0


def ab_to_landscape(plane_a: bytes, plane_b: bytes) -> Image.Image:
    img = Image.new("RGB", (LAND_W, LAND_H))
    pix = img.load()
    for y in range(LAND_H):
        for x in range(LAND_W):
            a = bit_at(plane_a, x, y)
            b = bit_at(plane_b, x, y)
            if a == 0 and b == 0:
                pix[x, y] = (220, 0, 0)
            elif a == 0 and b == 1:
                pix[x, y] = (0, 0, 0)
            else:
                pix[x, y] = (255, 255, 255)
    return img


def main() -> None:
    plane_a, plane_b = load_ab()
    land = ab_to_landscape(plane_a, plane_b)
    CAP.mkdir(parents=True, exist_ok=True)
    land.save(CAP / "ov26_show4_money_landscape.png")
    nat = landscape_to_native(land)
    if nat.size != (NATIVE_W, NATIVE_H):
        raise SystemExit(f"native {nat.size}")
    nat.save(CAP / "ov26_show4_money_native.png")
    p10, p13 = pack_native(nat)
    out = UART / "v0.9d_nfc_show4"
    write_img_c(out, "TagStudio Shut Up And Take My Money 296x152", p10, p13)
    land.save(out / "preview_landscape.png")
    nat.save(out / "preview.png")
    print("p10 ones", sum(bin(b).count("1") for b in p10), "p13 ones", sum(bin(b).count("1") for b in p13))
    print("ok", out)


if __name__ == "__main__":
    main()
