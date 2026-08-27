#!/usr/bin/env bash
set -euo pipefail
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT="${1:-/tmp/ov26_idle.bin}"
SEC="${2:-15}"
pinctrl set 17 op dl
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout "$SEC" cat "$UART" >> "$OUT" || rc=$?
if [[ "${rc:-0}" -ne 0 && "${rc:-0}" -ne 124 ]]; then
    exit "$rc"
fi
echo "BYTES=$(wc -c < "$OUT")"
hexdump -C "$OUT"
python3 -c "
from pathlib import Path
import sys
b = Path(sys.argv[1]).read_bytes()
t = b.decode('ascii', 'replace')
print(t)
print('BANNERS', t.count('START'))
print('DONE', t.count('DONE'))
" "$OUT"
pinctrl get 17
