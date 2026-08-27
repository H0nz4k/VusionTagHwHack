#!/usr/bin/env bash
set -euo pipefail

UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT="/tmp/ov26_exp001d_ccreset.bin"

echo "== TAG ON =="
pinctrl set 17 op dl
sleep 1
pinctrl get 17

stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"

timeout 12 cat "$UART" >> "$OUT" &
CAP_PID=$!
sleep 1.2

echo "== cc-tool --reset =="
sudo cc-tool --reset

set +e
wait "$CAP_PID"
CAP_RC=$?
set -e

echo "CAP_RC=${CAP_RC}"
echo "BYTES=$(wc -c < "$OUT")"
echo "HEXDUMP:"
hexdump -C "$OUT"
echo "TEXT:"
python3 -c '
from pathlib import Path
b = Path("/tmp/ov26_exp001d_ccreset.bin").read_bytes()
t = b.decode("ascii", "replace")
print(t)
print("---")
print("RESET_CAUSE_LINES", t.count("RESET_CAUSE"))
print("BANNER_LINES", t.count("RESET CAUSE TEST"))
print("DOTS", t.count("."))
'
