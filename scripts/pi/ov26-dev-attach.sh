#!/usr/bin/env bash
# TAG1 / DEV bench reconnect. No pin 9. Order: 3 V + DD/DC/RESET, then USB cycle.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
"$RELAYS" idle
sleep 0.3
"$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then
        ok=1
        break
    fi
done
if [[ "$ok" -ne 1 ]]; then
    echo "no CC Debugger USB 0451:16a2"
    exit 4
fi
sudo cc-tool -t | tee /tmp/ov26_dev_attach_ident.txt
if grep -qi locked /tmp/ov26_dev_attach_ident.txt; then
    echo "LOCKED — not flashing this target from this helper"
    exit 3
fi
grep -q CC2510 /tmp/ov26_dev_attach_ident.txt || {
    echo "not CC2510"
    exit 3
}
echo "DEV reconnect OK. Green LED = TVCC. Pin 9 stays disconnected."
