#!/usr/bin/env bash
# Run on the Raspberry Pi. Never leave GPIO17/27 as inputs.
# Active-low coil, NO contacts: dh = OFF (open), dl = ON (closed).
set -euo pipefail

ensure_output() {
    local pin="$1"
    local line
    line="$(pinctrl get "$pin")"
    if echo "$line" | grep -q ' ip '; then
        pinctrl set "$pin" op dh
    fi
}

ensure_both_outputs() {
    ensure_output 17
    ensure_output 27
}

idle() {
    pinctrl set 17 op dh
    pinctrl set 27 op dh
}

tag_on() {
    ensure_both_outputs
    pinctrl set 17 op dl
}

tag_off() {
    ensure_both_outputs
    pinctrl set 17 op dh
}

dbg_on() {
    ensure_both_outputs
    pinctrl set 27 op dl
}

dbg_off() {
    ensure_both_outputs
    pinctrl set 27 op dh
}

guard() {
    ensure_both_outputs
}

status() {
    pinctrl get 17
    pinctrl get 27
}

cmd="${1:-status}"
case "$cmd" in
    idle) idle; status ;;
    tag-on) tag_on; status ;;
    tag-off) tag_off; status ;;
    dbg-on) dbg_on; status ;;
    dbg-off) dbg_off; status ;;
    guard) guard; status ;;
    status) status ;;
    *)
        echo "Usage: $0 idle|tag-on|tag-off|dbg-on|dbg-off|guard|status" >&2
        exit 2
        ;;
esac
