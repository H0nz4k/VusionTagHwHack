#!/usr/bin/env bash
# OBSOLETE: GPIO27 no longer power-cycles debugger USB.
# USB 0451:16a2 should stay present. GPIO27 = RESET_N+DD+DC isolate.
set -euo pipefail
WAIT_SEC="${1:-10}"

echo "== BEFORE =="
pinctrl get 17
pinctrl get 27
lsusb | grep -E '0451:16a2' || echo "USB: no CC Debugger"

echo "== RELAY 2 OFF 2s (GPIO27 dh) =="
pinctrl set 27 op dh
pinctrl get 27
sleep 2

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

echo "== lsusb =="
lsusb
echo "== cc-tool =="
sudo cc-tool -t 2>&1 | head -20 || true

if (( found == 1 )); then
    echo "RESULT: PASS debugger enumerated"
    exit 0
fi
echo "RESULT: FAIL no 0451:16a2 in ${WAIT_SEC}s"
echo "GPIO27 left ON (dl)"
exit 1
