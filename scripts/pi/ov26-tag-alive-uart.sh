#!/usr/bin/env bash
# Tag-only power + UART listen. Debugger relay stays OFF.
set -euo pipefail
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT="/tmp/ov26_tag_alive.bin"
SEC=12

echo "== idle (both coils off) =="
/home/hw/bin/ov26-relays.sh idle

test -e "$UART"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"

echo "== arm UART ${SEC}s, then TAG ON (GPIO17 only) =="
timeout "$SEC" cat "$UART" >> "$OUT" &
CAP=$!
sleep 1
/home/hw/bin/ov26-relays.sh tag-on

set +e
wait "$CAP"
set -e

echo "== TAG OFF =="
/home/hw/bin/ov26-relays.sh tag-off

echo "BYTES=$(wc -c < "$OUT")"
echo "HEAD:"
hexdump -C "$OUT" | head -12
python3 -c "
from pathlib import Path
b=Path('/tmp/ov26_tag_alive.bin').read_bytes()
t=b.decode('ascii','replace')
print('RESET_CAUSE', t.count('RESET_CAUSE'))
print('POR', t.count('POR/BROWNOUT'))
print('EXTERNAL', t.count('EXTERNAL_RESET_N'))
print('DOTS', t.count('.'))
print('V03E', t.count('RESET PROBE START'))
print('TEXT:')
print(t[:400])
"
