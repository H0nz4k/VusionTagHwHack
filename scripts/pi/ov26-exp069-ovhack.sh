#!/usr/bin/env bash
# Leave OpenVusionHack on glass. No reflash. Wait for ttyACM0 after GPIO20.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT
"$RELAYS" idle
sleep 0.3
"$RELAYS" tag-on
sleep 1.0
"$RELAYS" twn4-on
ok=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
    sleep 1
    if [[ -e /dev/ttyACM0 ]] && lsusb | grep -q '09d8:0420'; then
        if [[ -r /dev/ttyACM0 && -w /dev/ttyACM0 ]]; then
            ok=1
            break
        fi
    fi
done
[[ "$ok" -eq 1 ]] || { echo "ttyACM0 not ready"; ls -l /dev/ttyACM0 || true; exit 4; }
python3 -u "$CLI" send /tmp/ovhack.bin --xfer 72 --wait 16 --process-s 0.22 --no-twn4-gpio
echo OVH2_RC=$?
