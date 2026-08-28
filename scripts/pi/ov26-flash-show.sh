#!/usr/bin/env bash
# Flash saved NFC SHOW firmware (v0.10e) onto the attached CC2510.
# DEV / sacrificed tag only. Refuses if cc-tool is not CC2510.
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW
HEX="$ROOT/OpenVusion26_GU140_FW_UART_DIAG/build/v0.10e_nfc_show3.hex"
RELHEX="$ROOT/firmware/releases/v0.10e_nfc_show3.hex"
RELAYS=/home/hw/bin/ov26-relays.sh
if [[ ! -f "$HEX" && -f "$RELHEX" ]]; then
    HEX="$RELHEX"
fi
if [[ ! -f "$HEX" ]]; then
    echo "missing hex (build v0.10e_nfc_show3 or copy firmware/releases/v0.10e_nfc_show3.hex)"
    exit 1
fi
"$RELAYS" idle
sleep 0.3
"$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no CC Debugger USB 0451:16a2"; "$RELAYS" idle; exit 4; }
sudo cc-tool -t | tee /tmp/ov26_flash_ident.txt | grep -q CC2510 || {
    echo "not CC2510 — refusing erase/write"
    "$RELAYS" idle
    exit 3
}
sudo cc-tool -v read -e -w "$HEX"
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" tag-off
sleep 2
"$RELAYS" tag-on
echo "v0.10e on tag. Debugger isolated, TAG ON."
echo "Show: /home/hw/bin/ov26-nfc-show.sh"
