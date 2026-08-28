#!/usr/bin/env bash
# EXP-045: after v0.7a is on the DEV tag. Isolated. Bounded. TAG OFF on exit.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
BASE=/tmp/ov26_exp045_base.bin
FIELD=/tmp/ov26_exp045_field.bin
WATCH=/tmp/ov26_exp045_watch.jsonl
cleanup() { "$RELAYS" idle || true; }
trap cleanup EXIT

dump() {
    local out="$1"
    local secs="$2"
    : > "$out"
    stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
    timeout "$secs" cat "$UART" >> "$out" &
    local cap=$!
    sleep 1
    "$RELAYS" tag-on
    set +e
    wait "$cap"
    set -e
    "$RELAYS" tag-off
    sleep 1
}

"$RELAYS" idle
sleep 0.3
echo "=== BASELINE (no TWN4) ==="
dump "$BASE" 10
python3 - "$BASE" <<'PY'
from pathlib import Path
import sys
b = Path(sys.argv[1]).read_bytes()
t = b.decode("ascii", "replace")
print(t[-1500:])
print("BYTES", len(b), "EXP-045", t.count("EXP-045"), "DONE", t.count("DONE"), "FIELD=01", t.count("FIELD=01"))
PY

echo "=== FIELD (TWN4 watch 12s) ==="
: > "$FIELD"
: > "$WATCH"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
timeout 22 cat "$UART" >> "$FIELD" &
CAP=$!
sleep 1
"$RELAYS" tag-on
sleep 2
set +e
timeout 12 python3 "$CLI" --port /dev/ttyACM0 field-watch --wait 10 > "$WATCH"
set -e
set +e
wait "$CAP"
set -e
"$RELAYS" idle
python3 - "$FIELD" "$WATCH" <<'PY'
from pathlib import Path
import sys
b = Path(sys.argv[1]).read_bytes()
t = b.decode("ascii", "replace")
w = Path(sys.argv[2]).read_text(errors="replace")
print("---UART---")
print(t[-2000:])
print("BYTES", len(b), "EXP-045", t.count("EXP-045"), "FIELD=01", t.count("FIELD=01"), "FIELD=00", t.count("FIELD=00"), "LED=01", t.count("LED=01"))
print("---WATCH---")
print(w[-1500:])
PY
echo EXP045_DONE
