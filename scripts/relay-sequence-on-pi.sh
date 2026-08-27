#!/usr/bin/env bash
# Run ON the Raspberry Pi. Relay 1 GPIO17, relay 2 GPIO27. Active-low.
set -euo pipefail
DELAY="${1:-2}"
echo "1 ON  GPIO17 dl"
pinctrl set 17 op dl
pinctrl get 17
sleep "$DELAY"
echo "2 ON  GPIO27 dl"
pinctrl set 27 op dl
pinctrl get 27
sleep "$DELAY"
echo "3 OFF GPIO17 dh"
pinctrl set 17 op dh
pinctrl get 17
sleep "$DELAY"
echo "4 OFF GPIO27 dh"
pinctrl set 27 op dh
pinctrl get 27
echo DONE
