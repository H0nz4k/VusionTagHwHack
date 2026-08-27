#!/usr/bin/env bash
# Energize GPIO21 (debugger USB +5 V) and wait for 0451:16a2.
# Does not attach debug lines or tag power. For full programmer use attach.
set -euo pipefail
WAIT_SEC="${1:-8}"
if ! [[ "$WAIT_SEC" =~ ^[0-9]+$ ]] || (( WAIT_SEC < 2 || WAIT_SEC > 20 )); then
    echo "Usage: $0 [wait_seconds 2-20]" >&2
    exit 2
fi

echo "== BEFORE =="
pinctrl get 21
lsusb | grep -E '0451:16a2' || echo "USB: no CC Debugger"

echo "== GPIO21 ON (dl) =="
pinctrl set 21 op dl
pinctrl get 21

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

lsusb | grep -E '0451:16a2' || echo "USB: no CC Debugger"
if (( found == 1 )); then
    echo "RESULT: PASS debugger enumerated (target not expected without attach)"
    exit 0
fi
echo "RESULT: FAIL debugger did not enumerate in ${WAIT_SEC}s"
exit 1
