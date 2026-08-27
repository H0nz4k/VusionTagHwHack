#!/usr/bin/env bash
# Programmer attach: tag 3V + RESET/DD/DC, then debugger USB +5 V cycle.
set -euo pipefail
ssh vusion-rpi '/home/hw/bin/ov26-relays.sh attach'
