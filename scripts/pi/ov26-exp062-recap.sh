#!/usr/bin/env bash
set -euo pipefail
R=/home/hw/bin/ov26-relays.sh
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
OUT=/tmp/ov26_exp062_cat.bin
grep -a CFG3A /home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.11f_nfc_cfg3a.hex && echo HAS_CFG3A || echo NO_CFG3A_IN_HEX
"$R" idle
sleep 0.4
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff raw -echo
timeout 1 cat "$UART" >/dev/null 2>&1 || true
: > "$OUT"
timeout 12 cat "$UART" >> "$OUT" &
CAP=$!
sleep 0.5
"$R" tag-on
set +e
wait "$CAP"
set -e
echo "BYTES $(wc -c < "$OUT")"
python3 -c "print(open('$OUT','rb').read()[:800])"
