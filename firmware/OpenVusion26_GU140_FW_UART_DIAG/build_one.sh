#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-v0.3a_uart_baseline}"
case "$TARGET" in
  v0.3a_uart_baseline|v0.3b_hsrc_13mhz|v0.3c_busy_passive|v0.3d_power_only|v0.3e_reset_probe|v0.3f_led_p2|v0.3g_led_slow|v0.3h_led_named|v0.3i_led_boost_sink|v0.3j_led_onoff|v0.3k_led_regdump|v0.4a_busy_passive|v0.4b_pwr_only|v0.4c_reset_hlh|v0.4d_spi_idle|v0.4e_cmd00|v0.4f_min_init|v0.4g_fb_load|v0.4h_refresh|v0.4i_stripes|v0.4j_bwr_cal|v0.4k_bwr_19|v0.4l_ovhack|v0.5a_rf_dump|v0.5b_rf_idle|v0.5c_rf_rxrssi|v0.5d_rf_txping|v0.6a_nfc_ack|v0.6b_nfc_ack0|v0.6c_nfc_uart|v0.6d_nfc_sess|v0.6e_nfc_sess2|v0.6f_nfc_eep|v0.7a_nfc_fd_led|v0.7b_nfc_fd_1hz|v0.8a_nfc_refresh|v0.9a_nfc_show1|v0.9b_nfc_show2|v0.9c_nfc_show3|v0.10a_nfc_showcmd|v0.10b_nfc_unlock|v0.10c_nfc_i2c_after_rf|v0.10d_nfc_show4|v0.10e_nfc_show3|v0.11a_nfc_sram|v0.11b_nfc_pthru|v0.11c_nfc_nc19|v0.11d_nfc_poll|v0.11e_nfc_mirror|v0.11f_nfc_cfg3a|v0.11g_nfc_cfg3a_16b|v0.11h_nfc_sram64|v0.11i_nfc_sramwait) ;;
  *) echo "Unknown target"; exit 2 ;;
esac
OBJ="$ROOT/build/obj_$TARGET"
mkdir -p "$OBJ" "$ROOT/build"
CFLAGS=(-mmcs51 -pcc2510fx --model-small --iram-size 256 --xram-loc 0xF000 --xram-size 0xF00 --code-size 32768 -I"$ROOT/common" -I"$ROOT/$TARGET")
# v0.4c/v0.4d: extra GPIO/SPI code tripped UART garbage with default overlay.
if [[ "$TARGET" == v0.4c_reset_hlh || "$TARGET" == v0.4d_spi_idle || "$TARGET" == v0.4e_cmd00 || "$TARGET" == v0.4f_min_init || "$TARGET" == v0.4g_fb_load || "$TARGET" == v0.4h_refresh || "$TARGET" == v0.4i_stripes || "$TARGET" == v0.4j_bwr_cal || "$TARGET" == v0.4k_bwr_19 || "$TARGET" == v0.4l_ovhack || "$TARGET" == v0.5a_rf_dump || "$TARGET" == v0.5b_rf_idle || "$TARGET" == v0.5c_rf_rxrssi || "$TARGET" == v0.5d_rf_txping || "$TARGET" == v0.6a_nfc_ack || "$TARGET" == v0.6b_nfc_ack0 || "$TARGET" == v0.6c_nfc_uart || "$TARGET" == v0.6d_nfc_sess || "$TARGET" == v0.6e_nfc_sess2 || "$TARGET" == v0.6f_nfc_eep || "$TARGET" == v0.7a_nfc_fd_led || "$TARGET" == v0.7b_nfc_fd_1hz || "$TARGET" == v0.8a_nfc_refresh || "$TARGET" == v0.9a_nfc_show1 || "$TARGET" == v0.9b_nfc_show2 || "$TARGET" == v0.9c_nfc_show3 || "$TARGET" == v0.10a_nfc_showcmd || "$TARGET" == v0.10b_nfc_unlock || "$TARGET" == v0.10c_nfc_i2c_after_rf || "$TARGET" == v0.10d_nfc_show4 || "$TARGET" == v0.10e_nfc_show3 || "$TARGET" == v0.11a_nfc_sram || "$TARGET" == v0.11b_nfc_pthru || "$TARGET" == v0.11c_nfc_nc19 || "$TARGET" == v0.11d_nfc_poll || "$TARGET" == v0.11e_nfc_mirror || "$TARGET" == v0.11f_nfc_cfg3a || "$TARGET" == v0.11g_nfc_cfg3a_16b || "$TARGET" == v0.11h_nfc_sram64 || "$TARGET" == v0.11i_nfc_sramwait ]]; then
    CFLAGS+=(--nooverlay)
fi
sdcc "${CFLAGS[@]}" -c "$ROOT/$TARGET/main.c" -o "$OBJ/main.rel"
sdcc "${CFLAGS[@]}" -c "$ROOT/common/clock.c" -o "$OBJ/clock.rel"
sdcc "${CFLAGS[@]}" -c "$ROOT/common/uart1.c" -o "$OBJ/uart1.rel"
RELS=("$OBJ/main.rel" "$OBJ/clock.rel" "$OBJ/uart1.rel")
if [[ "$TARGET" == v0.4l_ovhack || "$TARGET" == v0.9a_nfc_show1 || "$TARGET" == v0.9b_nfc_show2 || "$TARGET" == v0.9c_nfc_show3 ]]; then
    sdcc "${CFLAGS[@]}" -c "$ROOT/$TARGET/img_ovhack.c" -o "$OBJ/img_ovhack.rel"
    RELS+=("$OBJ/img_ovhack.rel")
fi
if [[ "$TARGET" == v0.10a_nfc_showcmd || "$TARGET" == v0.10b_nfc_unlock || "$TARGET" == v0.10c_nfc_i2c_after_rf || "$TARGET" == v0.10d_nfc_show4 || "$TARGET" == v0.10e_nfc_show3 ]]; then
    sdcc "${CFLAGS[@]}" -c "$ROOT/$TARGET/img_rle.c" -o "$OBJ/img_rle.rel"
    RELS+=("$OBJ/img_rle.rel")
fi
# RF-A..D stay clock+uart+main only. Extra radio.rel overlayed UART (EXP-035).
sdcc "${CFLAGS[@]}" -o "$ROOT/build/$TARGET.ihx" "${RELS[@]}"
cp "$ROOT/build/$TARGET.ihx" "$ROOT/build/$TARGET.hex"
ls -lh "$ROOT/build/$TARGET.hex"
