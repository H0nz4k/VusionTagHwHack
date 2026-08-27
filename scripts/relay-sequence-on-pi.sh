#!/usr/bin/env bash
# Run ON the Raspberry Pi. GPIO17 = tag 3V, GPIO27 = RESET_N+DD+DC. Active-low.
set -euo pipefail
DELAY="${1:-2}"
/home/hw/bin/ov26-relays.sh idle
echo "1 ON  GPIO17 dl"
/home/hw/bin/ov26-relays.sh tag-on
sleep "$DELAY"
echo "2 ON  GPIO27 dl"
/home/hw/bin/ov26-relays.sh dbg-on
sleep "$DELAY"
echo "3 OFF GPIO17 dh"
/home/hw/bin/ov26-relays.sh tag-off
sleep "$DELAY"
echo "4 OFF GPIO27 dh"
/home/hw/bin/ov26-relays.sh dbg-off
echo DONE
