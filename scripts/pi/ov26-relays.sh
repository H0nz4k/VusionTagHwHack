#!/usr/bin/env bash
# Run on the Raspberry Pi. Never leave GPIO17/20/21/27 as inputs.
# Active-low coil, NO contacts: dh = OFF (open), dl = ON (closed).
#
# BCM GPIO17  Pi pin 11  tag ~3 V
# BCM GPIO27  Pi pin 13  RESET_N + DD + DC (3 relays, one GPIO)
# BCM GPIO21  Pi pin 40  CC Debugger USB +5 V only (not GND, not pin 9)
# BCM GPIO20  Pi pin 38  TWN4 USB +5 V only (not tag 3 V, not USB D+/D−)
#
# Idle = all dh: tag off, debug isolated, debugger USB off, TWN4 USB off (no RF).
set -euo pipefail

PINS=(17 27 21 20)

ensure_output() {
    local pin="$1"
    local line
    line="$(pinctrl get "$pin")"
    if echo "$line" | grep -q ' ip '; then
        pinctrl set "$pin" op dh
    fi
}

ensure_all_outputs() {
    local pin
    for pin in "${PINS[@]}"; do
        ensure_output "$pin"
    done
}

idle() {
    # RF off first, then isolate debug so an unpowered debugger cannot sit on RESET_N.
    pinctrl set 20 op dh
    pinctrl set 27 op dh
    pinctrl set 21 op dh
    pinctrl set 17 op dh
}

tag_on() {
    ensure_all_outputs
    pinctrl set 17 op dl
}

tag_off() {
    ensure_all_outputs
    pinctrl set 17 op dh
}

dbg_on() {
    ensure_all_outputs
    pinctrl set 27 op dl
}

dbg_off() {
    ensure_all_outputs
    pinctrl set 27 op dh
}

usb_on() {
    # USB enumerate only with tag 3 V + DD/DC/RESET already closed.
    # usb-on alone (GPIO21 without 17/27) = red LED / No target.
    ensure_all_outputs
    local g17 g27
    g17="$(pinctrl get 17)"
    g27="$(pinctrl get 27)"
    if ! echo "$g17" | grep -q ' lo '; then
        echo "usb-on refused: GPIO17 (tag 3 V) is OFF. Use: $0 attach" >&2
        exit 1
    fi
    if ! echo "$g27" | grep -q ' lo '; then
        echo "usb-on refused: GPIO27 (DD/DC/RESET) is OFF. Use: $0 attach" >&2
        exit 1
    fi
    pinctrl set 21 op dh
    sleep 1
    pinctrl set 21 op dl
}

usb_off() {
    ensure_all_outputs
    pinctrl set 21 op dh
}

twn4_on() {
    ensure_all_outputs
    pinctrl set 20 op dh
    sleep 1
    pinctrl set 20 op dl
}

twn4_off() {
    ensure_all_outputs
    pinctrl set 20 op dh
}

# Programmer attach: tag 3V + debug lines, THEN USB enumerate with TVCC present.
# Never usb-on alone — clone stays red / No target if USB enumerated without lines.
# TWN4 stays off (no RF during flash).
attach() {
    ensure_all_outputs
    pinctrl set 20 op dh
    pinctrl set 17 op dl
    pinctrl set 27 op dl
    pinctrl set 21 op dh
    sleep 1
    pinctrl set 21 op dl
}

reconnect() {
    attach
}

guard() {
    ensure_all_outputs
}

status() {
    pinctrl get 17
    pinctrl get 27
    pinctrl get 21
    pinctrl get 20
}

cmd="${1:-status}"
case "$cmd" in
    idle) idle; status ;;
    tag-on) tag_on; status ;;
    tag-off) tag_off; status ;;
    dbg-on) dbg_on; status ;;
    dbg-off) dbg_off; status ;;
    usb-on) usb_on; status ;;
    usb-off) usb_off; status ;;
    twn4-on|nfc-on) twn4_on; status ;;
    twn4-off|nfc-off) twn4_off; status ;;
    attach|reconnect) attach; status ;;
    guard) guard; status ;;
    status) status ;;
    *)
        echo "Usage: $0 idle|tag-on|tag-off|dbg-on|dbg-off|usb-on|usb-off|twn4-on|twn4-off|attach|reconnect|guard|status" >&2
        exit 2
        ;;
esac
