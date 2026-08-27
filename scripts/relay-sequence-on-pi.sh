#!/usr/bin/env bash
# Run ON the Raspberry Pi. GPIO17 tag, GPIO27 debug lines, GPIO21 USB 5V.
set -euo pipefail
R=/home/hw/bin/ov26-relays.sh
"$R" idle
echo "1 tag-on"
"$R" tag-on
sleep 2
echo "2 dbg-on"
"$R" dbg-on
sleep 2
echo "3 usb-on"
"$R" usb-on
sleep 2
echo "4 idle"
"$R" idle
echo DONE
