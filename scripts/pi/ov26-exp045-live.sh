#!/usr/bin/env bash
# 55 s live demo: TAG ON, debugger off, TWN4 watch + UART. TAG OFF on exit.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
OUT=/tmp/ov26_exp045_live.bin
WATCH=/tmp/ov26_exp045_live.jsonl
cleanup() { "$RELAYS" idle || true; }
trap cleanup EXIT
"$RELAYS" idle
sleep 0.4
: > "$OUT"
: > "$WATCH"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
timeout 58 cat "$UART" >> "$OUT" &
CAP=$!
sleep 1
"$RELAYS" tag-on
echo "TAG ON — approach TWN4 to the GU140 now (55s)"
set +e
python3 "$CLI" --port /dev/ttyACM0 field-watch --wait 55 >> "$WATCH"
set -e
set +e
wait "$CAP"
set -e
python3 - "$OUT" "$WATCH" <<'PY'
from pathlib import Path
import sys
b = Path(sys.argv[1]).read_bytes()
t = b.decode("ascii", "replace")
print(t[-2000:])
print("BYTES", len(b), "FIELD=01", t.count("FIELD=01"), "LED=01", t.count("LED=01"))
print("---WATCH---")
print(Path(sys.argv[2]).read_text(errors="replace"))
PY
echo LIVE_DONE
