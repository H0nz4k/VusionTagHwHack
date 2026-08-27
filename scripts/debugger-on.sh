#!/usr/bin/env bash
# Connect RESET_N + DD + DC via GPIO27. USB +5 V is GPIO21 (usb-on.sh).
set -euo pipefail
ssh vusion-rpi '/home/hw/bin/ov26-relays.sh dbg-on'
