#!/usr/bin/env bash
# EXP-014: GPIO21 switches CC Debugger USB +5 V.
# Phase A: USB enumerate/disappear with tag+debug isolated.
# Phase B: attach sequence then cc-tool -t (no flash).
# Bounded. Always ends idle.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
IDENT=/tmp/ov26_exp014_ident.txt

cleanup() {
    "$RELAYS" idle || true
}
trap cleanup EXIT

usb_present() {
    lsusb | grep -q '0451:16a2'
}

wait_usb() {
    local want="$1"
    local i
    for i in 1 2 3 4 5 6 7 8; do
        sleep 1
        if [[ "$want" == present ]] && usb_present; then
            echo "USB_${want} at ${i}s"
            return 0
        fi
        if [[ "$want" == absent ]] && ! usb_present; then
            echo "USB_${want} at ${i}s"
            return 0
        fi
    done
    if [[ "$want" == present ]]; then
        echo "USB_TIMEOUT still absent"
        return 1
    fi
    echo "USB_TIMEOUT still present"
    return 1
}

echo "== PHASE A USB 5V via GPIO21 =="
"$RELAYS" idle
sleep 0.5
"$RELAYS" status
if usb_present; then echo "IDLE_USB=present (FAIL: 5V should be cut)"; else echo "IDLE_USB=absent (good)"; fi
wait_usb absent || true

"$RELAYS" usb-on
if wait_usb present; then echo "PHASE_A_ON=PASS"; else echo "PHASE_A_ON=FAIL"; exit 4; fi

"$RELAYS" usb-off
if wait_usb absent; then echo "PHASE_A_OFF=PASS"; else echo "PHASE_A_OFF=FAIL"; exit 5; fi

echo "== PHASE B attach + cc-tool -t =="
"$RELAYS" attach
if wait_usb present; then echo "ATTACH_USB=present"; else echo "ATTACH_USB=FAIL"; exit 6; fi
"$RELAYS" status

set +e
timeout 8 sudo cc-tool -t > "$IDENT" 2>&1
echo "CC_TOOL_RC=$?"
set -e
cat "$IDENT"

if grep -q 'CC2510' "$IDENT"; then
    echo "PHASE_B=PASS target CC2510"
else
    echo "PHASE_B=FAIL no CC2510 — USB cycle once more"
    "$RELAYS" usb-off
    sleep 1
    "$RELAYS" usb-on
    wait_usb present || true
    set +e
    timeout 8 sudo cc-tool -t > "$IDENT" 2>&1
    echo "CC_TOOL_RC2=$?"
    set -e
    cat "$IDENT"
    if grep -q 'CC2510' "$IDENT"; then
        echo "PHASE_B=PASS target CC2510 after second USB cycle"
    else
        echo "PHASE_B=FAIL no CC2510"
        exit 7
    fi
fi
echo DONE
