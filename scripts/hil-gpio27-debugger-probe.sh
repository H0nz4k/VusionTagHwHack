#!/usr/bin/env bash
# Bounded GPIO27 debugger-power probe. Does not touch GPIO17 except to report it.
set -euo pipefail

dump() {
    local label="$1"
    echo "==== $label ===="
    pinctrl get 17
    pinctrl get 27
    lsusb | grep -E '0451:16a2|16a2|CC Debugger' || echo "USB: no CC Debugger"
    sudo cc-tool -t 2>&1 | head -8 || true
    echo
}

dump "NOW (no change yet)"

echo "== GPIO27 OUTPUT HIGH (dh) + wait 4s =="
pinctrl set 27 op dh
sleep 4
dump "after dh"

echo "== GPIO27 OUTPUT LOW (dl) + wait 4s =="
pinctrl set 27 op dl
sleep 4
dump "after dl"

echo "== GPIO27 OUTPUT HIGH (dh) again + wait 4s =="
pinctrl set 27 op dh
sleep 4
dump "after dh again"

echo "== dmesg USB (last 30 lines matching usb/debugger) =="
dmesg -T 2>/dev/null | grep -iE '0451|16a2|cc.?debug|usb .*disconnect|usb .*new' | tail -20 || true
