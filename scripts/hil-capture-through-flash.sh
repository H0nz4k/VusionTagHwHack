#!/usr/bin/env bash
# Start UART first, then flash, so the post-program boot banner is captured.
# Does not use cc-tool --reset (that extra reset is a separate stimulus).
set -euo pipefail

ROOT="${ROOT:-/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG}"
TARGET="${1:?target required}"
CAPTURE_SEC="${2:-25}"
OUT="${3:-/tmp/ov26_uart_capture.bin}"

if ! [[ "$CAPTURE_SEC" =~ ^[0-9]+$ ]] || (( CAPTURE_SEC < 5 || CAPTURE_SEC > 60 )); then
    echo "ERROR: capture seconds must be 5..60" >&2
    exit 2
fi

UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
HEX="$ROOT/build/${TARGET}.hex"
[[ -f "$HEX" ]] || { echo "ERROR: missing $HEX" >&2; exit 1; }
[[ -e "$UART" ]] || { echo "ERROR: UART not found" >&2; exit 1; }

echo "== TAG ON =="
pinctrl set 17 op dl
sleep 1

echo "== Identify =="
sudo cc-tool -t | tee /tmp/ov26_cc_tool_ident.txt
if ! grep -q 'ID: 0x2510' /tmp/ov26_cc_tool_ident.txt; then
    echo "ERROR: target is not CC2510 0x2510 — refusing to flash" >&2
    exit 3
fi

stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
echo "== Capture ${CAPTURE_SEC}s starts before flash =="
timeout "$CAPTURE_SEC" cat "$UART" >> "$OUT" &
CAP_PID=$!
sleep 1.0

echo "== Flash $HEX =="
sudo cc-tool -v read -e -w "$HEX"

set +e
wait "$CAP_PID"
CAP_RC=$?
set -e
if [[ "$CAP_RC" -ne 0 && "$CAP_RC" -ne 124 ]]; then
    echo "ERROR: UART capture failed rc=$CAP_RC" >&2
    exit "$CAP_RC"
fi

echo "== TAG remains ON =="
pinctrl get 17
echo "BYTES=$(wc -c < "$OUT")"
echo "HEXDUMP:"
hexdump -C "$OUT"
python3 -c "
from pathlib import Path
b = Path('$OUT').read_bytes()
t = b.decode('ascii', 'replace')
print('==== TEXT ====')
print(t)
print('--- counts ---')
print('RESET_CAUSE', t.count('RESET_CAUSE'))
print('POR', t.count('POR/BROWNOUT'))
print('EXTERNAL_RESET_N', t.count('EXTERNAL_RESET_N'))
print('PASSIVE_BUSY', t.count('PASSIVE BUSY START'))
print('BUSY=', t.count('BUSY='))
print('BUSY CHANGED', t.count('BUSY CHANGED'))
print('DOTS', t.count('.'))
"
