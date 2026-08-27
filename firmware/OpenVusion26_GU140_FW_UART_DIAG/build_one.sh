#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-v0.3a_uart_baseline}"
case "$TARGET" in
  v0.3a_uart_baseline|v0.3b_hsrc_13mhz|v0.3c_busy_passive|v0.3d_power_only|v0.3e_reset_probe|v0.3f_led_p2|v0.3g_led_slow|v0.3h_led_named|v0.3i_led_boost_sink) ;;
  *) echo "Unknown target"; exit 2 ;;
esac
OBJ="$ROOT/build/obj_$TARGET"
mkdir -p "$OBJ" "$ROOT/build"
CFLAGS=(-mmcs51 -pcc2510fx --model-small --iram-size 256 --xram-loc 0xF000 --xram-size 0xF00 --code-size 32768 -I"$ROOT/common")
sdcc "${CFLAGS[@]}" -c "$ROOT/$TARGET/main.c" -o "$OBJ/main.rel"
sdcc "${CFLAGS[@]}" -c "$ROOT/common/clock.c" -o "$OBJ/clock.rel"
sdcc "${CFLAGS[@]}" -c "$ROOT/common/uart1.c" -o "$OBJ/uart1.rel"
sdcc "${CFLAGS[@]}" -o "$ROOT/build/$TARGET.ihx" "$OBJ/main.rel" "$OBJ/clock.rel" "$OBJ/uart1.rel"
cp "$ROOT/build/$TARGET.ihx" "$ROOT/build/$TARGET.hex"
ls -lh "$ROOT/build/$TARGET.hex"
