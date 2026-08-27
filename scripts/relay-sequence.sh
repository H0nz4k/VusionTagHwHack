#!/usr/bin/env bash
# Relay click check via ov26-relays.sh. Ends idle. No loops.
set -euo pipefail
DELAY="${1:-2}"
if ! [[ "$DELAY" =~ ^[0-9]+$ ]] || (( DELAY < 1 || DELAY > 10 )); then
    echo "Usage: $0 [delay_seconds 1-10]" >&2
    exit 2
fi
R=/home/hw/bin/ov26-relays.sh
ssh vusion-rpi "set -euo pipefail
R='$R'
DELAY='$DELAY'
\$R idle
echo '1 tag-on'
\$R tag-on
sleep \"\$DELAY\"
echo '2 dbg-on'
\$R dbg-on
sleep \"\$DELAY\"
echo '3 usb-on'
\$R usb-on
sleep \"\$DELAY\"
echo '4 idle'
\$R idle
echo DONE
"
