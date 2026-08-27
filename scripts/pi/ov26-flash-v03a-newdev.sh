#!/usr/bin/env bash
# Flash UART-only v0.3a onto the newly sacrificed DEV tag.
# Requires explicit human OK (this run). Erase+write+verify. Does not lock.
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
RELAYS=/home/hw/bin/ov26-relays.sh
HEX="$ROOT/build/v0.3a_uart_baseline.hex"
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT=/tmp/ov26_exp008.bin

[[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }
[[ -e "$UART" ]] || { echo "missing UART"; exit 1; }

echo "== idle then DBG ON =="
"$RELAYS" idle
sleep 1
"$RELAYS" dbg-on
i=0
while (( i < 8 )); do
    sleep 1
    i=$((i + 1))
    if lsusb | grep -q '0451:16a2'; then
        echo "debugger USB at ${i}s"
        break
    fi
done
lsusb | grep 0451:16a2

echo "== TAG ON =="
"$RELAYS" tag-on
sleep 2

echo "== identify =="
sudo cc-tool -t 2>&1 | tee /tmp/ov26_exp008_ident.txt | head -24
if ! grep -q 'CC2510' /tmp/ov26_exp008_ident.txt; then
    echo "ERROR: not CC2510, abort"
    "$RELAYS" idle
    exit 3
fi

echo "== erase+write+verify $HEX =="
sudo cc-tool -v read -e -w "$HEX"

echo "== UART 15s after flash =="
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout 15 cat "$UART" >> "$OUT" || rc=$?
if [[ "${rc:-0}" -ne 0 && "${rc:-0}" -ne 124 ]]; then
    echo "uart rc=$rc"
fi
echo "BYTES=$(wc -c < "$OUT")"
hexdump -C "$OUT" | head -16
python3 -c "
from pathlib import Path
b=Path('/tmp/ov26_exp008.bin').read_bytes()
t=b.decode('ascii','replace')
print(t[:500])
print('RESET_CAUSE', t.count('RESET_CAUSE'))
print('POR', t.count('POR/BROWNOUT'))
print('EXT', t.count('EXTERNAL_RESET_N'))
print('DOTS', t.count('.'))
print('V03E', t.count('RESET PROBE'))
"

echo "== leave TAG ON, DBG ON for inspection =="
"$RELAYS" status
echo DONE
