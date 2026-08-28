#!/usr/bin/env bash
# EXP-045 field half. Firmware already on tag. TAG OFF on exit.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
OUT=/tmp/ov26_exp045_field.bin
WATCH=/tmp/ov26_exp045_watch.jsonl
cleanup() { "$RELAYS" idle || true; }
trap cleanup EXIT
"$RELAYS" idle
sleep 0.5
: > "$OUT"
: > "$WATCH"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
timeout 22 cat "$UART" >> "$OUT" &
CAP=$!
sleep 1
"$RELAYS" tag-on
sleep 2
set +e
python3 "$CLI" --port /dev/ttyACM0 field-watch --wait 12 >> "$WATCH"
set -e
set +e
wait "$CAP"
set -e
python3 - "$OUT" "$WATCH" <<'PY'
from pathlib import Path
import sys
b = Path(sys.argv[1]).read_bytes()
t = b.decode("ascii", "replace")
print(t[-2500:])
print("BYTES", len(b), "EXP-045", t.count("EXP-045"), "FIELD=01", t.count("FIELD=01"), "FIELD=00", t.count("FIELD=00"), "LED=01", t.count("LED=01"))
print("---WATCH---")
print(Path(sys.argv[2]).read_text(errors="replace")[-2000:])
PY
echo FIELD_DONE
