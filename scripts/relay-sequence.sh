#!/usr/bin/env bash
# Four-step relay sequence. No loops.
# Relay 1 = BCM GPIO17 (tag)     pin 11
# Relay 2 = BCM GPIO27 (RESET_N+DD+DC ganged) pin 13
# Active-low: dl = ON, dh = OFF
#
# Usage: bash scripts/relay-sequence.sh [delay_seconds]
set -euo pipefail

DELAY="${1:-2}"
if ! [[ "$DELAY" =~ ^[0-9]+$ ]] || (( DELAY < 1 || DELAY > 10 )); then
    echo "Usage: $0 [delay_seconds 1-10]" >&2
    exit 2
fi

ssh vusion-rpi "set -euo pipefail
DELAY='$DELAY'

echo '1 ON  GPIO17 dl'
pinctrl set 17 op dl
pinctrl get 17
sleep \"\$DELAY\"

echo '2 ON  GPIO27 dl'
pinctrl set 27 op dl
pinctrl get 27
sleep \"\$DELAY\"

echo '3 OFF GPIO17 dh'
pinctrl set 17 op dh
pinctrl get 17
sleep \"\$DELAY\"

echo '4 OFF GPIO27 dh'
pinctrl set 27 op dh
pinctrl get 27

echo DONE
"
