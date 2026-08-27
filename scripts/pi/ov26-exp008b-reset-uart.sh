#!/usr/bin/env bash
set -euo pipefail
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT=/tmp/ov26_exp008b.bin
/home/hw/bin/ov26-relays.sh status
echo "== cc-tool -t =="
sudo cc-tool -t 2>&1 | head -20
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout 12 cat "$UART" >> "$OUT" &
CAP=$!
sleep 1.2
echo "== cc-tool --reset =="
sudo cc-tool --reset
set +e
wait "$CAP"
set -e
echo "BYTES=$(wc -c < "$OUT")"
hexdump -C "$OUT" | head -20
python3 -c "
from pathlib import Path
b=Path('/tmp/ov26_exp008b.bin').read_bytes()
t=b.decode('ascii','replace')
print(t)
print('RESET_CAUSE', t.count('RESET_CAUSE'), 'DOTS', t.count('.'))
"
