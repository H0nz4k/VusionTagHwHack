#!/usr/bin/env bash
# Isolate RESET_N + DD + DC (USB debugger stays powered).
set -euo pipefail
ssh vusion-rpi '/home/hw/bin/ov26-relays.sh dbg-off'
