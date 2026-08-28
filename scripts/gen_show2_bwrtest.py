#!/usr/bin/env python3
"""BWR 16-cell test PNG 296x152 -> native p10/p13 for SHOW slot 2."""
from __future__ import annotations

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

PNG = (
    ROOT
    / "tools"
    / "TagStudio"
    / "testPIC"
    / "orignal_pic"
    / "new"
    / "BWR_barevny_test_EDG2-0260-A_296x152.png"
)


def main() -> None:
    if not PNG.exists():
        raise SystemExit(f"missing {PNG}")
    land = Image.open(PNG).convert("RGB")
    if land.size != (LAND_W, LAND_H):
        land = land.resize((LAND_W, LAND_H), Image.Resampling.NEAREST)
    CAP.mkdir(parents=True, exist_ok=True)
    land.save(CAP / "ov26_show2_bwrtest_landscape.png")
    nat = landscape_to_native(land)
    if nat.size != (NATIVE_W, NATIVE_H):
        raise SystemExit(f"native {nat.size}")
    nat.save(CAP / "ov26_show2_bwrtest_native.png")
    p10, p13 = pack_native(nat)
    out = UART / "v0.9e_nfc_bwrtest"
    write_img_c(out, "BWR 16-cell palette/dither test 296x152", p10, p13)
    land.save(out / "preview_landscape.png")
    nat.save(out / "preview.png")
    print("p10 ones", sum(bin(b).count("1") for b in p10), "p13 ones", sum(bin(b).count("1") for b in p13))
    print("ok", out)


if __name__ == "__main__":
    main()
