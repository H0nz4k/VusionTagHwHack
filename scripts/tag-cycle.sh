#!/usr/bin/env bash
set -euo pipefail
OFF_SECONDS="${1:-2}"
if ! [[ "$OFF_SECONDS" =~ ^[0-9]+$ ]] || (( OFF_SECONDS < 1 || OFF_SECONDS > 10 )); then
    echo "Usage: $0 [off_seconds 1-10]" >&2
    exit 2
fi
ssh vusion-rpi "set -euo pipefail
/home/hw/bin/ov26-relays.sh tag-off
sleep '$OFF_SECONDS'
/home/hw/bin/ov26-relays.sh tag-on
"
