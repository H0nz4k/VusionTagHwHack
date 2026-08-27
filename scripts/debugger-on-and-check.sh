#!/usr/bin/env bash
# Run ON the Raspberry Pi.
# OBSOLETE assumption: GPIO27 no longer switches USB +5 V.
# GPIO27 now gangs RESET_N+DD+DC. USB 0451:16a2 should already be present.
# Prefer scripts/pi/ov26-exp012-debug-isolate.sh after wiring changes.
set -euo pipefail

WAIT_SEC="${1:-8}"
if ! [[ "$WAIT_SEC" =~ ^[0-9]+$ ]] || (( WAIT_SEC < 2 || WAIT_SEC > 20 )); then
    echo "Usage: $0 [wait_seconds 2-20]" >&2
    exit 2
fi

echo "== BEFORE =="
pinctrl get 17
pinctrl get 27
lsusb | grep -E '0451:16a2' || echo "USB: no CC Debugger"

echo "== RELAY 2 ON (GPIO27 dl) =="
pinctrl set 27 op dl
pinctrl get 27

found=0
i=0
while (( i < WAIT_SEC )); do
    sleep 1
    i=$((i + 1))
    if lsusb | grep -q '0451:16a2'; then
        echo "USB found after ${i}s"
        found=1
        break
    fi
    echo "wait ${i}/${WAIT_SEC}"
done

echo "== AFTER =="
pinctrl get 27
lsusb | grep -E '0451:16a2' || echo "USB: no CC Debugger"

if (( found == 1 )); then
    echo "== cc-tool -t =="
    sudo cc-tool -t 2>&1 | head -20
    echo "RESULT: PASS debugger enumerated"
    exit 0
fi

echo "RESULT: FAIL debugger did not enumerate in ${WAIT_SEC}s"
echo "GPIO27 left ON (dl) so you can check the debugger LED."
exit 1
