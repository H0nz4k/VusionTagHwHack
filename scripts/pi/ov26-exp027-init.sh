#!/usr/bin/env bash
# EXP-027: minimal init register_data_sm. Isolated. TAG OFF after.
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
RELAYS=/home/hw/bin/ov26-relays.sh
HEX="$ROOT/build/v0.4f_min_init.hex"
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
IDENT=/tmp/ov26_exp027_ident.txt
FLASHLOG=/tmp/ov26_exp027_flash.txt
POR=/tmp/ov26_exp027_por.bin
cleanup() { "$RELAYS" idle || true; }
trap cleanup EXIT
[[ -f "$HEX" ]] || exit 1
"$RELAYS" idle
sleep 0.3
"$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || exit 4
sudo cc-tool -t > "$IDENT" 2>&1
grep -q 'CC2510' "$IDENT" || exit 3
sudo cc-tool -v read -e -w "$HEX" 2>&1 | tee "$FLASHLOG"
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" tag-off
sleep 2
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$POR"
timeout 32 cat "$UART" >> "$POR" &
CAP=$!
sleep 1
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e
python3 - <<'PY'
from pathlib import Path
b = Path("/tmp/ov26_exp027_por.bin").read_bytes()
t = b.decode("ascii", "replace")
print(t[:3000])
print("BYTES", len(b), "K", t.count("EXP-027"), "DONE", t.count("DONE"))
ok = t.count("EXP-027")==1 and t.count("DONE")==1 and "SR=01" in t and "PSR=01" in t
print("UART", "PASS" if ok else "FAIL")
PY
echo DONE
