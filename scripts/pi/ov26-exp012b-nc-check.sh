#!/usr/bin/env bash
# EXP-012b: distinguish NC vs open-debug-path.
# Tag ON, GPIO27 stays dh (coil off), cc-tool -t.
# If NC relays, dh = contacts closed = target visible.
# Bounded, no flash, ends idle.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
IDLE=/tmp/ov26_exp012b_idle.bin
IDENT=/tmp/ov26_exp012b_ident_dh.txt

cleanup() {
    "$RELAYS" idle || true
}
trap cleanup EXIT

"$RELAYS" idle
sleep 0.5
test -e "$UART"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo

echo "== idle UART 8s (tag off, GPIO27 dh) =="
: > "$IDLE"
timeout 8 cat "$UART" >> "$IDLE" || true
python3 - <<'PY'
from pathlib import Path
b = Path("/tmp/ov26_exp012b_idle.bin").read_bytes()
t = b.decode("ascii", "replace")
print("IDLE_BYTES", len(b), "hex", b[:16].hex())
print("IDLE_DOTS", t.count("."))
print("IDLE_BANNERS", t.count("RESET CAUSE TEST"))
PY

echo "== tag-on, GPIO27 stays dh, cc-tool -t =="
"$RELAYS" tag-on
sleep 0.5
"$RELAYS" status
set +e
timeout 8 sudo cc-tool -t > "$IDENT" 2>&1
echo "CC_TOOL_RC=$?"
set -e
cat "$IDENT"
if grep -q 'CC2510' "$IDENT"; then
    echo "DH_TARGET=PASS (relays likely NC: coil-off = debug connected)"
else
    echo "DH_TARGET=FAIL no CC2510 (debug path open at both polarities, or tag not on debug bus)"
fi

"$RELAYS" idle
echo DONE
