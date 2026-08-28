#!/usr/bin/env bash
# DEV only. Isolated flash v0.10g (slot 3 new TagStudio zip), recap UART, TAG ON.
set -euo pipefail
HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.10e_nfc_show3.hex
RELAYS=/home/hw/bin/ov26-relays.sh
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
POR=/tmp/ov26_exp056_por.bin
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
sudo cc-tool -t | tee /tmp/ov26_exp056_ident.txt | grep -q CC2510 || { echo "not CC2510"; "$RELAYS" idle; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp056_flash.txt
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" tag-off
sleep 2
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
timeout 1 cat "$UART" >/dev/null 2>&1 || true
sleep 0.5
echo FLASH_OK
"$RELAYS" idle
sleep 0.3
timeout 1 cat "$UART" >/dev/null 2>&1 || true
sleep 0.4
: > "$POR"
timeout 12 cat "$UART" >> "$POR" &
CAP=$!
sleep 1
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e
python3 - "$POR" <<'PY'
from pathlib import Path
import sys
b = Path(sys.argv[1]).read_bytes()
t = b.decode("ascii", "replace")
print(t[:2500])
print("BYTES", len(b), "v0.10g", t.count("v0.10g"), "SHOW4", t.count("SHOW4"), "ARMED", t.count("ARMED"))
PY
echo "TAG ON. Menu: /home/hw/bin/ov26-nfc-show.sh  (3 = nový TagStudio export)"
