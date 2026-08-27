#!/usr/bin/env bash
# Power dbg then tag, UART around cc-tool --reset. No flash.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT=/tmp/ov26_exp009.bin

"$RELAYS" idle
sleep 1
echo "== DBG ON =="
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
sleep 1
sudo cc-tool -t 2>&1 | head -18

test -e "$UART"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout 15 cat "$UART" >> "$OUT" &
CAP=$!
sleep 1.2
echo "== reset =="
sudo cc-tool --reset
set +e
wait "$CAP"
set -e

echo "BYTES=$(wc -c < "$OUT")"
hexdump -C "$OUT" | head -24
python3 -c "
from pathlib import Path
b=Path('/tmp/ov26_exp009.bin').read_bytes()
t=b.decode('ascii','replace')
print(t)
print('RESET_CAUSE', t.count('RESET_CAUSE'))
print('POR', t.count('POR/BROWNOUT'))
print('EXT', t.count('EXTERNAL_RESET_N'))
print('DOTS', t.count('.'))
print('PROBE', t.count('RESET PROBE'))
"
"$RELAYS" status
echo DONE
