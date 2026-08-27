#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-v0.3_reference_probe}"
OBJDIR="$ROOT/build/obj_${TARGET}"
mkdir -p "$OBJDIR" "$ROOT/build"

COMMON_SOURCES=(
  "$ROOT/common/clock.c"
  "$ROOT/common/timebase.c"
  "$ROOT/common/uart1.c"
)

case "$TARGET" in
  v0.3_reference_probe)
    EXTRA_SOURCES=()
    ;;
  v0.4_cog_probe|v0.5_epd_testpattern)
    EXTRA_SOURCES=("$ROOT/common/epd.c")
    ;;
  v0.6_nfc_probe)
    EXTRA_SOURCES=("$ROOT/common/i2c.c")
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    echo "Targets: v0.3_reference_probe v0.4_cog_probe v0.5_epd_testpattern v0.6_nfc_probe" >&2
    exit 2
    ;;
esac

CFLAGS=(
  -mmcs51
  -pcc2510fx
  --model-small
  --iram-size 256
  --xram-loc 0xF000
  --xram-size 0xF00
  --code-size 32768
  -I"$ROOT/common"
)

compile_one() {
  local src="$1"
  local name="$2"
  echo "  CC  $src"
  sdcc "${CFLAGS[@]}" -c "$src" -o "$OBJDIR/${name}.rel"
}

echo "==> Building $TARGET"
rm -f "$OBJDIR"/*.rel

# SDCC compiles one C source at a time.
compile_one "$ROOT/$TARGET/main.c" main
compile_one "$ROOT/common/clock.c" clock
compile_one "$ROOT/common/timebase.c" timebase
compile_one "$ROOT/common/uart1.c" uart1

REL_FILES=(
  "$OBJDIR/main.rel"
  "$OBJDIR/clock.rel"
  "$OBJDIR/timebase.rel"
  "$OBJDIR/uart1.rel"
)

if [[ "$TARGET" == "v0.4_cog_probe" || "$TARGET" == "v0.5_epd_testpattern" ]]; then
  compile_one "$ROOT/common/epd.c" epd
  REL_FILES+=("$OBJDIR/epd.rel")
fi

if [[ "$TARGET" == "v0.6_nfc_probe" ]]; then
  compile_one "$ROOT/common/i2c.c" i2c
  REL_FILES+=("$OBJDIR/i2c.rel")
fi

OUT_IHX="$ROOT/build/${TARGET}.ihx"
OUT_HEX="$ROOT/build/${TARGET}.hex"

echo "  LD  $OUT_IHX"
# Main object must be first for SDCC's linker.
sdcc "${CFLAGS[@]}" -o "$OUT_IHX" "${REL_FILES[@]}"

# cc-tool 0.26 used on this lab host identifies Intel HEX by the .hex extension.
cp "$OUT_IHX" "$OUT_HEX"

echo
echo "Built:"
ls -lh "$OUT_IHX" "$OUT_HEX"
echo
echo "Flash only when the stage prerequisites in README.md are satisfied:"
echo "  sudo cc-tool -v read -e -w \"$OUT_HEX\""
