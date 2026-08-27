#!/usr/bin/env bash
# Capture UART while TAG is forced OFF. Used to verify no parasitic MCU power.
set -euo pipefail
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT="${1:-/tmp/ov26_tagoff.bin}"
SEC="${2:-8}"
pinctrl set 17 op dh
pinctrl get 17
sleep 1
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout "$SEC" cat "$UART" >> "$OUT" || rc=$?
if [[ "${rc:-0}" -ne 0 && "${rc:-0}" -ne 124 ]]; then
    exit "$rc"
fi
echo "BYTES=$(wc -c < "$OUT")"
hexdump -C "$OUT"
pinctrl get 17
