#!/usr/bin/env bash
# True POR via GPIO17 relay. Requires CC Debugger disconnected from the tag.
# Does not invoke cc-tool (no flash, no debug reset).
set -euo pipefail

UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT="${1:-/tmp/ov26_por.bin}"
CAPTURE_SEC="${2:-30}"
OFF_SEC="${3:-2}"

if ! [[ "$CAPTURE_SEC" =~ ^[0-9]+$ ]] || (( CAPTURE_SEC < 5 || CAPTURE_SEC > 60 )); then
    echo "ERROR: capture seconds must be 5..60" >&2
    exit 2
fi
if ! [[ "$OFF_SEC" =~ ^[0-9]+$ ]] || (( OFF_SEC < 1 || OFF_SEC > 10 )); then
    echo "ERROR: off seconds must be 1..10" >&2
    exit 2
fi
if [[ ! -e "$UART" ]]; then
    echo "ERROR: UART adapter not found" >&2
    exit 1
fi

echo "== Confirm debugger is not talking to target =="
set +e
IDENT="$(sudo cc-tool -t 2>&1)"
CC_RC=$?
set -e
echo "$IDENT"
if echo "$IDENT" | grep -q 'ID: 0x2510'; then
    echo "ERROR: CC2510 still visible — debugger is still connected. Refusing POR test." >&2
    exit 3
fi

echo "== TAG OFF ${OFF_SEC}s (should be a real power cut) =="
pinctrl set 17 op dh
pinctrl get 17
sleep "$OFF_SEC"

stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"

echo "== Arm UART ${CAPTURE_SEC}s, then TAG ON =="
timeout "$CAPTURE_SEC" cat "$UART" >> "$OUT" &
CAP_PID=$!
sleep 1.2
pinctrl set 17 op dl
pinctrl get 17

set +e
wait "$CAP_PID"
CAP_RC=$?
set -e
if [[ "$CAP_RC" -ne 0 && "$CAP_RC" -ne 124 ]]; then
    echo "ERROR: UART capture failed rc=$CAP_RC" >&2
    pinctrl set 17 op dh || true
    exit "$CAP_RC"
fi

echo "== TAG OFF after capture (debugger disconnected: this is a real power cut) =="
pinctrl set 17 op dh
pinctrl get 17

echo "BYTES=$(wc -c < "$OUT")"
echo "HEXDUMP:"
hexdump -C "$OUT"
python3 -c "
from pathlib import Path
import sys
b = Path(sys.argv[1]).read_bytes()
t = b.decode('ascii', 'replace')
print('==== TEXT ====')
print(t)
print('--- counts ---')
print('START', t.count('START'))
print('RESET_PROBE', t.count('RESET PROBE START'))
print('DONE', t.count('DONE / safe shutdown'))
print('POR', t.count('POR/BROWNOUT'))
print('EXTERNAL_RESET_N', t.count('EXTERNAL_RESET_N'))
print('POWER ON', t.count('POWER ON'))
print('BUSY=', t.count('BUSY='))
" "$OUT"
