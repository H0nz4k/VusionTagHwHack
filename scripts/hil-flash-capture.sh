#!/usr/bin/env bash
# Bounded DEV-tag flash + UART capture. Runs on the Raspberry Pi.
# Usage (from repo, via ssh): TARGET=v0.3a_uart_baseline CAPTURE_SEC=15
set -euo pipefail

ROOT="${ROOT:-/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG}"
TARGET="${1:-v0.3a_uart_baseline}"
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

echo "== TAG ON for identify + flash =="
pinctrl set 17 op dl
sleep 1

echo "== Identify target =="
sudo cc-tool -t | tee /tmp/ov26_cc_tool_ident.txt
if ! grep -q 'ID: 0x2510' /tmp/ov26_cc_tool_ident.txt; then
    echo "ERROR: target is not CC2510 0x2510 — refusing to flash" >&2
    pinctrl set 17 op dh || true
    exit 3
fi

echo "== Flash $HEX =="
sudo cc-tool -v read -e -w "$HEX"

echo "== TAG OFF before capture =="
pinctrl set 17 op dh
sleep 2

stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"

echo "== UART capture ${CAPTURE_SEC}s, then TAG ON =="
timeout "$CAPTURE_SEC" cat "$UART" >> "$OUT" &
CAP_PID=$!
sleep 0.4
pinctrl set 17 op dl

set +e
wait "$CAP_PID"
CAP_RC=$?
set -e

echo "== TAG OFF after capture =="
pinctrl set 17 op dh
pinctrl get 17

if [[ "$CAP_RC" -ne 0 && "$CAP_RC" -ne 124 ]]; then
    echo "ERROR: UART capture failed rc=$CAP_RC" >&2
    exit "$CAP_RC"
fi

echo "== Capture bytes =="
wc -c "$OUT"
echo "== Capture text =="
# Replace non-printables except CR/LF so the log is safe to store.
tr -cd '\11\12\15\40-\176' < "$OUT"
echo
echo "== END =="
