#!/usr/bin/env bash
# GPIO21 USB +5 V cycle. Debugger lines stay isolated. Bounded.
set -euo pipefail
WAIT_SEC="${1:-8}"
if ! [[ "$WAIT_SEC" =~ ^[0-9]+$ ]] || (( WAIT_SEC < 2 || WAIT_SEC > 20 )); then
    echo "Usage: $0 [wait_seconds 2-20]" >&2
    exit 2
fi

echo "== BEFORE =="
pinctrl get 17
pinctrl get 27
pinctrl get 21
lsusb | grep -E '0451:16a2' || echo "USB: no CC Debugger"

echo "== GPIO21 OFF 2s =="
pinctrl set 21 op dh
pinctrl get 21
sleep 2

echo "== GPIO21 ON =="
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

echo "== AFTER =="
pinctrl get 21
lsusb | grep -E '0451:16a2' || echo "USB: no CC Debugger"

if (( found == 1 )); then
    echo "RESULT: PASS debugger enumerated"
    echo "GPIO21 left ON (dl). Run usb-off / idle when done."
    exit 0
fi
echo "RESULT: FAIL no 0451:16a2 in ${WAIT_SEC}s"
echo "GPIO21 left ON (dl)"
exit 1
