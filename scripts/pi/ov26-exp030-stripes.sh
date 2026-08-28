#!/usr/bin/env bash
# EXP-030: vertical 8px B/W stripes + DCDC + 0x12. Isolated. TAG OFF after.
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
RELAYS=/home/hw/bin/ov26-relays.sh
HEX="$ROOT/build/v0.4i_stripes.hex"
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
IDENT=/tmp/ov26_exp030_ident.txt
FLASHLOG=/tmp/ov26_exp030_flash.txt
POR=/tmp/ov26_exp030_por.bin
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
timeout 55 cat "$UART" >> "$POR" &
CAP=$!
sleep 1
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e
python3 - <<'PY'
from pathlib import Path
b = Path("/tmp/ov26_exp030_por.bin").read_bytes()
t = b.decode("ascii", "replace")
print(t[:4000])
print("---TAIL---")
print(t[-800:])
print("BYTES", len(b), "K", t.count("EXP-030"), "DONE", t.count("DONE"))
hb = t.count("HB ")
print("HB", hb, "BUSY0", t.count("BUSY=0"), "BUSY1", t.count("BUSY=1"))
ok = t.count("EXP-030")==1 and t.count("DONE")==1 and "REF=01" in t and "N10=15F8" in t and "N13=15F8" in t
print("UART", "PASS" if ok else "FAIL")
PY
echo DONE
