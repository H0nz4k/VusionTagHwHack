#!/usr/bin/env bash
# Observe-only probe of a newly wired tag. NO erase/write/flash.
set -euo pipefail
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT="/tmp/ov26_newtag_uart.bin"
RELAYS=/home/hw/bin/ov26-relays.sh

echo "== START idle =="
"$RELAYS" idle
echo "== USB =="
lsusb
echo "== UART path =="
ls -l /dev/serial/by-id/ 2>/dev/null || echo "no /dev/serial/by-id"

echo "== DBG ON, wait 6s =="
"$RELAYS" dbg-on
i=0
dbg=0
while (( i < 6 )); do
    sleep 1
    i=$((i + 1))
    if lsusb | grep -q '0451:16a2'; then
        echo "debugger USB at ${i}s"
        dbg=1
        break
    fi
    echo "wait dbg ${i}/6"
done
lsusb | grep 0451:16a2 || echo "USB: no CC Debugger"
echo "== cc-tool before tag power =="
sudo cc-tool -t 2>&1 | head -20 || true

echo "== TAG ON, wait 2s =="
"$RELAYS" tag-on
sleep 2
"$RELAYS" status
echo "== cc-tool after tag power =="
sudo cc-tool -t 2>&1 | tee /tmp/ov26_newtag_cctool.txt | head -24

if [[ -e "$UART" ]]; then
    echo "== UART 10s =="
    stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
    : > "$OUT"
    timeout 10 cat "$UART" >> "$OUT" || rc=$?
    if [[ "${rc:-0}" -ne 0 && "${rc:-0}" -ne 124 ]]; then
        echo "uart rc=$rc"
    fi
    echo "UART_BYTES=$(wc -c < "$OUT")"
    hexdump -C "$OUT" | head -8
else
    echo "== UART adapter not present, skip capture =="
fi

echo "== IDLE =="
"$RELAYS" idle
echo DONE
