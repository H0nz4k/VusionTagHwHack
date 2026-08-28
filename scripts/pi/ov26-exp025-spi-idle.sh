#!/usr/bin/env bash
# EXP-025: Phase D SPI idle. Isolated. TAG OFF after. No bytes on SPI.
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
RELAYS=/home/hw/bin/ov26-relays.sh
HEX="$ROOT/build/v0.4d_spi_idle.hex"
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
IDENT=/tmp/ov26_exp025_ident.txt
FLASHLOG=/tmp/ov26_exp025_flash.txt
POR=/tmp/ov26_exp025_por.bin
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
b = Path("/tmp/ov26_exp025_por.bin").read_bytes()
t = b.decode("ascii", "replace")
print(t[:3200])
print("BYTES", len(b), "K", t.count("EXP-025"), "DONE", t.count("DONE"))
uart_ok = t.count("EXP-025") == 1 and t.count("DONE") == 1
post = t.split("POST", 1)[-1] if "POST" in t else ""
p02_ok = ("P0_2SEL=0" in post) and ("P0_2DIR=0" in post)
cs_ok = ("CS=1" in post) and ("CS=0" not in post.split("HB", 1)[0])
sel_ok = ("P0SEL3=1" in post) and ("P0SEL5=1" in post)
print("UART", "PASS" if uart_ok else "FAIL")
print("P0_2", "PASS" if p02_ok else "FAIL")
print("CS", "PASS" if cs_ok else "FAIL")
print("SEL", "PASS" if sel_ok else "FAIL")
PY
echo DONE
