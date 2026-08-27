#!/usr/bin/env bash
# EXP-013b: USB debugger replugged. Identify only, no flash.
# Abort if USB 0451:16a2 disappears when coils energize (5V sag).
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
IDENT=/tmp/ov26_exp013b_ident.txt

cleanup() {
    "$RELAYS" idle || true
}
trap cleanup EXIT

usb_ok() {
    lsusb | grep -q '0451:16a2'
}

"$RELAYS" idle
sleep 0.3
echo "== idle =="
"$RELAYS" status
if usb_ok; then echo "USB_DBG=present"; else echo "USB_DBG=absent"; exit 3; fi

"$RELAYS" dbg-on
sleep 0.4
echo "== dbg-on =="
"$RELAYS" status
if usb_ok; then echo "USB_DBG=present after dbg-on"; else echo "USB_DBG=ABSENT after dbg-on (coil sag?)"; exit 4; fi

"$RELAYS" tag-on
sleep 0.5
echo "== tag-on =="
"$RELAYS" status
if usb_ok; then echo "USB_DBG=present after tag-on"; else echo "USB_DBG=ABSENT after tag-on (coil sag?)"; exit 5; fi

set +e
timeout 8 sudo cc-tool -t > "$IDENT" 2>&1
echo "CC_TOOL_RC=$?"
set -e
cat "$IDENT"
if grep -q 'CC2510' "$IDENT"; then
    echo "EXP013B=PASS target CC2510"
else
    echo "EXP013B=FAIL no CC2510"
fi
echo DONE
