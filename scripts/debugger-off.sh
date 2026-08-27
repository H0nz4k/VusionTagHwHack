#!/usr/bin/env bash
# Isolate RESET_N + DD + DC. USB +5 V is GPIO21 (usb-off.sh).
set -euo pipefail
ssh vusion-rpi '/home/hw/bin/ov26-relays.sh dbg-off'
