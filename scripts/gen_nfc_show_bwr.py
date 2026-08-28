#!/usr/bin/env python3
"""Bake NFC-show BWR planes: (1) copy OpenVusionHack (2) TagHack landscape (3) Fry PNG."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

NATIVE_W = 152
NATIVE_H = 296
LAND_W = 296
LAND_H = 152
ROW_B = NATIVE_W // 8
PLANE = NATIVE_H * ROW_B

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (220, 0, 0)

ROOT = Path(__file__).resolve().parents[1]
UART = ROOT / "firmware" / "OpenVusion26_GU140_FW_UART_DIAG"
SRC_OVH = UART / "v0.4l_ovhack"
PNG3 = ROOT / "tools" / "TagStudio" / "testPIC" / "small_296x152" / "dithered_image.png"
CAP = ROOT / "captures"


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("arialbd.ttf", "arial.ttf", "segoeuib.ttf", "segoeui.ttf", "calibrib.ttf"):
        path = Path(r"C:\Windows\Fonts") / name
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def fit_text(draw: ImageDraw.ImageDraw, text: str, max_w: int, start: int) -> ImageFont.ImageFont:
    size = start
    while size >= 10:
        font = load_font(size)
        bbox = draw.textbbox((0, 0), text, font=font)
        if (bbox[2] - bbox[0]) <= max_w:
            return font
        size -= 1
    return load_font(10)


def classify(r: int, g: int, b: int) -> str:
    dr = (r - 220) ** 2 + (g - 0) ** 2 + (b - 0) ** 2
    db = r ** 2 + g ** 2 + b ** 2
    dw = (r - 255) ** 2 + (g - 255) ** 2 + (b - 255) ** 2
    if dr <= db and dr <= dw:
        return "R"
    if db <= dw:
        return "B"
    return "W"


def pack_native(img: Image.Image) -> tuple[bytearray, bytearray]:
    img = img.convert("RGB")
    if img.size != (NATIVE_W, NATIVE_H):
        raise SystemExit(f"native size {img.size}, expected {NATIVE_W}x{NATIVE_H}")
    p10 = bytearray(PLANE)
    p13 = bytearray(PLANE)
    pix = img.load()
    for y in range(NATIVE_H):
        for x in range(NATIVE_W):
            r, g, b = pix[x, y][:3]
            idx = y * ROW_B + (x // 8)
            mask = 1 << (7 - (x % 8))
            kind = classify(r, g, b)
            if kind == "R":
                p13[idx] |= mask
            elif kind == "B":
                p10[idx] |= mask
    return p10, p13


def landscape_to_native(land: Image.Image) -> Image.Image:
    """296x152 scenery -> 152x296 native scan.

    TRANSPOSE keeps TagHack along the long side (scenery, not a 90 deg artwork turn).
    FLIP_TOP_BOTTOM un-mirrors vs the first glass (ROTATE_90 was the wrong fix).
    """
    land = land.convert("RGB")
    if land.size != (LAND_W, LAND_H):
        land = land.resize((LAND_W, LAND_H), Image.Resampling.NEAREST)
    return land.transpose(Image.Transpose.FLIP_TOP_BOTTOM).transpose(Image.Transpose.TRANSPOSE)


def emit_c_array(name: str, data: bytes) -> str:
    lines = [f"const unsigned char {name}[{PLANE}] = {{"]
    for i in range(0, PLANE, 16):
        chunk = data[i : i + 16]
        body = ",".join(f"0x{b:02x}" for b in chunk)
        comma = "," if i + 16 < PLANE else ""
        lines.append(f"    {body}{comma}")
    lines.append("};")
    return "\n".join(lines)


def write_img_c(out_dir: Path, note: str, p10: bytes, p13: bytes) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    hdr = (
        f"/* Generated -- {note} */\n"
        "/* 152x296, 19 B/row, WHITE=00/00 BLACK=10=1 RED=13=1 */\n"
        "#include <stdint.h>\n"
        f"#define IMG_PLANE {PLANE}u\n\n"
    )
    (out_dir / "img_ovhack.c").write_text(
        hdr + emit_c_array("img_p10", p10) + "\n\n" + emit_c_array("img_p13", p13) + "\n",
        encoding="ascii",
    )
    (out_dir / "img_ovhack.h").write_text(
        "#ifndef IMG_OVHACK_H\n#define IMG_OVHACK_H\n"
        "extern const unsigned char img_p10[];\n"
        "extern const unsigned char img_p13[];\n#endif\n",
        encoding="ascii",
    )


def make_taghack() -> Image.Image:
    img = Image.new("RGB", (LAND_W, LAND_H), WHITE)
    draw = ImageDraw.Draw(img)
    margin = 8
    font_big = fit_text(draw, "TagHack", LAND_W - 2 * margin, 72)
    font_small = fit_text(draw, "HanzG", 90, 16)
    # Force HanzG clearly smaller than TagHack.
    try:
        big_px = font_big.size  # type: ignore[attr-defined]
        small_px = max(10, int(big_px * 0.28))
        font_small = load_font(small_px)
    except AttributeError:
        pass

    b_tag = draw.textbbox((0, 0), "Tag", font=font_big)
    b_hack = draw.textbbox((0, 0), "Hack", font=font_big)
    w_tag = b_tag[2] - b_tag[0]
    w_hack = b_hack[2] - b_hack[0]
    h_tag = b_tag[3] - b_tag[1]
    h_hack = b_hack[3] - b_hack[1]
    total_w = w_tag + w_hack
    total_h = max(h_tag, h_hack)
    x0 = (LAND_W - total_w) // 2 - b_tag[0]
    y0 = (LAND_H - total_h) // 2 - min(b_tag[1], b_hack[1])
    draw.text((x0, y0), "Tag", font=font_big, fill=RED)
    draw.text((x0 + w_tag + b_tag[0] - b_hack[0], y0 + (b_tag[1] - b_hack[1])), "Hack", font=font_big, fill=BLACK)

    b_hz = draw.textbbox((0, 0), "HanzG", font=font_small)
    w_hz = b_hz[2] - b_hz[0]
    h_hz = b_hz[3] - b_hz[1]
    x_hz = LAND_W - margin - w_hz - b_hz[0]
    y_hz = LAND_H - margin - h_hz - b_hz[1]
    draw.text((x_hz, y_hz), "HanzG", font=font_small, fill=BLACK)
    return img


def main() -> None:
    CAP.mkdir(parents=True, exist_ok=True)

    dst1 = UART / "v0.9a_nfc_show1"
    dst1.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SRC_OVH / "img_ovhack.c", dst1 / "img_ovhack.c")
    shutil.copy2(SRC_OVH / "img_ovhack.h", dst1 / "img_ovhack.h")
    if (SRC_OVH / "preview.png").exists():
        shutil.copy2(SRC_OVH / "preview.png", dst1 / "preview.png")
        shutil.copy2(SRC_OVH / "preview.png", CAP / "ov26_show1_ovhack.png")

    land2 = make_taghack()
    land2.save(CAP / "ov26_show2_taghack_landscape.png")
    nat2 = landscape_to_native(land2)
    nat2.save(CAP / "ov26_show2_taghack_native.png")
    p10, p13 = pack_native(nat2)
    write_img_c(UART / "v0.9b_nfc_show2", "TagHack landscape + HanzG", p10, p13)
    land2.save(UART / "v0.9b_nfc_show2" / "preview_landscape.png")
    nat2.save(UART / "v0.9b_nfc_show2" / "preview.png")
    print("show2 p10 ones", sum(bin(b).count("1") for b in p10), "p13 ones", sum(bin(b).count("1") for b in p13))

    if not PNG3.exists():
        raise SystemExit(f"missing {PNG3}")
    land3 = Image.open(PNG3).convert("RGB")
    land3.save(CAP / "ov26_show3_fry_landscape.png")
    nat3 = landscape_to_native(land3)
    nat3.save(CAP / "ov26_show3_fry_native.png")
    p10, p13 = pack_native(nat3)
    write_img_c(UART / "v0.9c_nfc_show3", "TagStudio dithered 296x152", p10, p13)
    land3.save(UART / "v0.9c_nfc_show3" / "preview_landscape.png")
    nat3.save(UART / "v0.9c_nfc_show3" / "preview.png")
    print("show3 p10 ones", sum(bin(b).count("1") for b in p10), "p13 ones", sum(bin(b).count("1") for b in p13))
    print("ok")


if __name__ == "__main__":
    main()
