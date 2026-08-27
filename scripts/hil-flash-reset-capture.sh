#!/usr/bin/env bash
# Flash a UART_DIAG target, keep TAG ON, capture around cc-tool --reset.
# Power-cycle via relay is NOT a MCU reset while the debugger is attached.
set -euo pipefail

ROOT="${ROOT:-/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG}"
TARGET="${1:?target required}"
CAPTURE_SEC="${2:-15}"
OUT="${3:-/tmp/ov26_uart_capture.bin}"

if ! [[ "$CAPTURE_SEC" =~ ^[0-9]+$ ]] || (( CAPTURE_SEC < 1 || CAPTURE_SEC > 60 )); then
    echo "ERROR: capture seconds must be 1..60" >&2
    exit 2
fi

UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
HEX="$ROOT/build/${TARGET}.hex"

if [[ ! -f "$HEX" ]]; then
    echo "ERROR: missing $HEX" >&2
    exit 1
fi
if [[ ! -e "$UART" ]]; then
    echo "ERROR: UART adapter not found" >&2
    exit 1
fi

echo "== TAG ON =="
pinctrl set 17 op dl
sleep 1

echo "== Identify =="
sudo cc-tool -t | tee /tmp/ov26_cc_tool_ident.txt
if ! grep -q 'ID: 0x2510' /tmp/ov26_cc_tool_ident.txt; then
    echo "ERROR: target is not CC2510 0x2510 — refusing to flash" >&2
    exit 3
fi

echo "== Flash $HEX =="
sudo cc-tool -v read -e -w "$HEX"

echo "== Idle capture ${CAPTURE_SEC}s after flash (no extra reset) =="
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
IDLE_OUT="${OUT}.idle"
: > "$IDLE_OUT"
timeout "$CAPTURE_SEC" cat "$UART" >> "$IDLE_OUT" || rc=$?
if [[ "${rc:-0}" -ne 0 && "${rc:-0}" -ne 124 ]]; then
    exit "$rc"
fi

echo "== Reset-triggered capture ${CAPTURE_SEC}s =="
: > "$OUT"
timeout "$CAPTURE_SEC" cat "$UART" >> "$OUT" &
CAP_PID=$!
sleep 1.2
sudo cc-tool --reset
set +e
wait "$CAP_PID"
CAP_RC=$?
set -e
if [[ "$CAP_RC" -ne 0 && "$CAP_RC" -ne 124 ]]; then
    echo "ERROR: UART capture failed rc=$CAP_RC" >&2
    exit "$CAP_RC"
fi

echo "== TAG remains ON (debugger parasitically powers MCU if relay is OFF) =="
pinctrl get 17

python3 -c "
from pathlib import Path
def report(label, path):
    b = Path(path).read_bytes()
    t = b.decode('ascii', 'replace')
    print('====', label, 'bytes', len(b), '====')
    print(t)
    print('--- counts ---')
    print('RESET_CAUSE', t.count('RESET_CAUSE'))
    print('POR', t.count('POR/BROWNOUT'))
    print('EXTERNAL_RESET_N', t.count('EXTERNAL_RESET_N'))
    print('WATCHDOG', t.count('WATCHDOG'))
    print('CLOCK_13', t.count('CLOCK=13MHZ_HSRC'))
    print('DOTS', t.count('.'))
    print()
report('IDLE_AFTER_FLASH', '${IDLE_OUT}')
report('AFTER_CC_RESET', '${OUT}')
"
