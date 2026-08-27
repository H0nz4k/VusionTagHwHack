#!/usr/bin/env bash
# True POR of v0.3a: debugger 5V off, tag off, UART arm, tag on.
# No flash. No cc-tool during capture.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OFF=/tmp/ov26_exp010_tagoff.bin
OUT=/tmp/ov26_exp010_por.bin

echo "== DBG OFF then TAG OFF =="
"$RELAYS" dbg-off
sleep 1
"$RELAYS" tag-off
sleep 2
"$RELAYS" status
lsusb | grep 0451:16a2 && echo "WARN: debugger USB still present" || echo "debugger USB gone (good)"

test -e "$UART"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo

echo "== listen 5s while TAG OFF (battery check) =="
: > "$OFF"
timeout 5 cat "$UART" >> "$OFF" || true
echo "TAGOFF_BYTES=$(wc -c < "$OFF")"
hexdump -C "$OFF" | head -4

echo "== POR: arm 20s UART, TAG ON =="
: > "$OUT"
timeout 20 cat "$UART" >> "$OUT" &
CAP=$!
sleep 1.2
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e

echo "== TAG OFF after capture =="
"$RELAYS" tag-off
"$RELAYS" status

echo "POR_BYTES=$(wc -c < "$OUT")"
hexdump -C "$OUT" | head -20
python3 -c "
from pathlib import Path
off=Path('/tmp/ov26_exp010_tagoff.bin').read_bytes()
b=Path('/tmp/ov26_exp010_por.bin').read_bytes()
t=b.decode('ascii','replace')
print('==== TAG OFF TEXT ====')
print(off.decode('ascii','replace'))
print('==== POR TEXT ====')
print(t)
print('START banners', t.count('RESET CAUSE TEST'))
print('RESET_CAUSE', t.count('RESET_CAUSE'))
print('POR', t.count('POR/BROWNOUT'))
print('EXT', t.count('EXTERNAL_RESET_N'))
print('WDG', t.count('WATCHDOG'))
print('DOTS', t.count('.'))
"
echo DONE
