#!/usr/bin/env bash
# Connect RESET_N + DD + DC via GPIO27 (USB debugger stays powered).
set -euo pipefail
ssh vusion-rpi '/home/hw/bin/ov26-relays.sh dbg-on'
