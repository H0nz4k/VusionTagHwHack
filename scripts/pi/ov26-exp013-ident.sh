#!/usr/bin/env bash
# EXP-013: debug path confirmed to tag board. Identify only, no flash.
# GPIO27 already intended ON (active-low). Tag 3V on, cc-tool -t, then idle.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
IDENT=/tmp/ov26_exp013_ident.txt

cleanup() {
    "$RELAYS" idle || true
}
trap cleanup EXIT

echo "== before =="
"$RELAYS" status
lsusb | grep 0451:16a2 || echo "USB_DBG=absent"

"$RELAYS" dbg-on
sleep 0.2
"$RELAYS" tag-on
sleep 0.5
echo "== powered =="
"$RELAYS" status

set +e
timeout 8 sudo cc-tool -t > "$IDENT" 2>&1
echo "CC_TOOL_RC=$?"
set -e
cat "$IDENT"

if grep -q 'CC2510' "$IDENT"; then
    echo "EXP013=PASS target CC2510"
else
    echo "EXP013=FAIL no CC2510"
fi
echo DONE
