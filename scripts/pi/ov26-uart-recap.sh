#!/usr/bin/env bash
# Bounded UART recapture. No flash. TAG OFF on exit.
set -euo pipefail
SECS="${1:-12}"
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT="/tmp/ov26_uart_recap.bin"
cleanup() { "$RELAYS" idle || true; }
trap cleanup EXIT
[[ -e "$UART" ]] || { echo "missing UART $UART"; exit 1; }
"$RELAYS" idle
sleep 0.3
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout "$SECS" cat "$UART" >> "$OUT" &
CAP=$!
sleep 1
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e
python3 - "$OUT" <<'PY'
import sys
from pathlib import Path
b = Path(sys.argv[1]).read_bytes()
t = b.decode("ascii", "replace")
print(t[:4000])
print("---TAIL---")
print(t[-400:])
print("BYTES", len(b), "EXP-036", t.count("EXP-036"), "DONE", t.count("DONE"))
ascii_ok = sum(1 for x in b if 32 <= x < 127 or x in (10, 13))
print("ASCII_RATIO", round(ascii_ok / max(len(b), 1), 3))
PY
echo RECAP_DONE
