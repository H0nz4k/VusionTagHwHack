#!/usr/bin/env bash
set -euo pipefail
echo "Fail-safe: both relays OFF (GPIO outputs HIGH)."
ssh vusion-rpi '/home/hw/bin/ov26-relays.sh idle'
