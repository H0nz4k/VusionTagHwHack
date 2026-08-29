#!/usr/bin/env bash
set -euo pipefail
R=/home/hw/bin/ov26-relays.sh
"$R" tag-on
sleep 0.4
"$R" twn4-on
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '09d8:0420'; then ok=1; break; fi
done
echo "TWN4_USB=$ok"
lsusb | grep 09d8 || true
python3 /home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py peek --wait 12
"$R" twn4-off
"$R" idle
