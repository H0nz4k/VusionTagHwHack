#!/usr/bin/env bash
# DEV tag. Interactive SHOW app (1/2/3) or: ov26-nfc-show.sh 2
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW
APP="$ROOT/tools/nfc_gateway/show_app.py"
CLI="$ROOT/tools/nfc_gateway/cli.py"
RELAYS=/home/hw/bin/ov26-relays.sh
DIAG="$ROOT/OpenVusion26_GU140_FW_UART_DIAG"

CHOICE="${1:-}"
if [[ "$CHOICE" == "flash" ]]; then
    HEX="$DIAG/build/v0.10e_nfc_show3.hex"
    [[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }
    "$RELAYS" idle
    sleep 0.3
    "$RELAYS" attach
    ok=0
    for i in 1 2 3 4 5 6 7 8; do
        sleep 1
        if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
    done
    [[ "$ok" -eq 1 ]] || { echo "no debugger"; "$RELAYS" idle; exit 4; }
    sudo cc-tool -t | grep -q CC2510 || { echo "not CC2510"; "$RELAYS" idle; exit 3; }
    sudo cc-tool -v read -e -w "$HEX"
    "$RELAYS" dbg-off
    "$RELAYS" usb-off
    "$RELAYS" tag-off
    sleep 2
    "$RELAYS" tag-on
    echo "Flashed v0.10e. TAG ON."
    shift || true
    CHOICE="${1:-}"
fi

if [[ -z "${CHOICE:-}" ]]; then
    exec python3 -u "$APP"
fi
case "$CHOICE" in
    1|2|3)
        echo "Hold TWN4 on the tag. LED blinks = keep it there. LED off = you can leave."
        python3 "$CLI" --port /dev/ttyACM0 show "$CHOICE" --wait 30
        echo "If LED is off, walk away. Glass may still update for ~15 s."
        ;;
    *)
        echo "Need 1, 2, 3 or no args for the menu app"
        exit 2
        ;;
esac
