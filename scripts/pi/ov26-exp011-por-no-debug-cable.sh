#!/usr/bin/env bash
# True POR with debug cable physically off the tag. GPIO27 stays off.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OFF=/tmp/ov26_exp011_tagoff.bin
OUT=/tmp/ov26_exp011_por.bin

"$RELAYS" idle
sleep 2
lsusb | grep 0451:16a2 && echo "WARN: debugger USB present" || echo "debugger USB absent (good)"
"$RELAYS" status

test -e "$UART"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OFF"
timeout 5 cat "$UART" >> "$OFF" || true
echo "TAGOFF_BYTES=$(wc -c < "$OFF")"

: > "$OUT"
timeout 20 cat "$UART" >> "$OUT" &
CAP=$!
sleep 1.2
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e

"$RELAYS" tag-off
echo "POR_BYTES=$(wc -c < "$OUT")"
hexdump -C "$OUT" | head -8
python3 -c "
from pathlib import Path
b=Path('/tmp/ov26_exp011_por.bin').read_bytes()
t=b.decode('ascii','replace')
n=max(t.count('RESET CAUSE TEST'),1)
print(t[:800])
print('bytes', len(b))
print('banners', t.count('RESET CAUSE TEST'))
print('POR', t.count('POR/BROWNOUT'))
print('EXT', t.count('EXTERNAL_RESET_N'))
print('WDG', t.count('WATCHDOG'))
print('DOTS', t.count('.'))
print('ms_per_boot', round(20000/t.count('RESET CAUSE TEST'),2) if t.count('RESET CAUSE TEST') else 'n/a')
"
"$RELAYS" status
echo DONE
