#!/usr/bin/env bash
# Bounded GPIO27 toggle test. Restores pin to input afterwards.
# Does not touch GPIO17 (tag power).
set -euo pipefail

echo "== BEFORE =="
pinctrl get 17
pinctrl get 27
sudo cc-tool -t 2>&1 | head -8 || true

echo "== GPIO27 OUTPUT HIGH (dh) 2s =="
pinctrl set 27 op dh
pinctrl get 27
sleep 2

echo "== GPIO27 OUTPUT LOW (dl) 2s =="
pinctrl set 27 op dl
pinctrl get 27
sleep 2

echo "== GPIO27 OUTPUT HIGH (dh) 2s again =="
pinctrl set 27 op dh
pinctrl get 27
sleep 2

echo "== RESTORE GPIO27 output HIGH (coil off) =="
pinctrl set 27 op dh
pinctrl get 27

echo "== AFTER (debugger still?) =="
pinctrl get 17
sudo cc-tool -t 2>&1 | head -8 || true
lsusb | grep -e 0451:16a2 || echo "CC Debugger USB not listed"
