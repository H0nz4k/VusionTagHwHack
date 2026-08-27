#!/usr/bin/env bash
# Run on the Raspberry Pi. Never leave GPIO17/21/27 as inputs.
# Active-low coil, NO contacts: dh = OFF (open), dl = ON (closed).
#
# BCM GPIO17  Pi pin 11  tag ~3 V
# BCM GPIO27  Pi pin 13  RESET_N + DD + DC (3 relays, one GPIO)
# BCM GPIO21  Pi pin 40  CC Debugger USB +5 V only (not GND, not pin 9)
#
# Idle = all dh: tag off, debug isolated, debugger USB unpowered.
set -euo pipefail

PINS=(17 27 21)

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
    # Isolate debug bus first so an unpowered debugger cannot sit on RESET_N.
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
    ensure_all_outputs
    pinctrl set 21 op dl
}

usb_off() {
    ensure_all_outputs
    pinctrl set 21 op dh
}

# Programmer attach: tag 3V + debug lines, then USB enumerate with TVCC present.
attach() {
    ensure_all_outputs
    pinctrl set 17 op dl
    pinctrl set 27 op dl
    pinctrl set 21 op dh
    sleep 1
    pinctrl set 21 op dl
}

guard() {
    ensure_all_outputs
}

status() {
    pinctrl get 17
    pinctrl get 27
    pinctrl get 21
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
    attach) attach; status ;;
    guard) guard; status ;;
    status) status ;;
    *)
        echo "Usage: $0 idle|tag-on|tag-off|dbg-on|dbg-off|usb-on|usb-off|attach|guard|status" >&2
        exit 2
        ;;
esac
