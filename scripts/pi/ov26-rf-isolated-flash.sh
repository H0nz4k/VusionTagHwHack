#!/usr/bin/env bash
# Isolated flash + bounded UART. TAG OFF + debug isolated on exit.
set -euo pipefail
EXP="${1:?EXP id e.g. 034}"
TARGET="${2:?firmware target}"
SECS="${3:-18}"
ROOT=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
RELAYS=/home/hw/bin/ov26-relays.sh
HEX="$ROOT/build/${TARGET}.hex"
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
IDENT="/tmp/ov26_exp${EXP}_ident.txt"
FLASHLOG="/tmp/ov26_exp${EXP}_flash.txt"
POR="/tmp/ov26_exp${EXP}_por.bin"
cleanup() { "$RELAYS" idle || true; }
trap cleanup EXIT
[[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }
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
timeout "$SECS" cat "$UART" >> "$POR" &
CAP=$!
sleep 1
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e
python3 - "$POR" "$EXP" <<'PY'
import sys
from pathlib import Path
por, exp = sys.argv[1], sys.argv[2]
b = Path(por).read_bytes()
t = b.decode("ascii", "replace")
print(t[:5000])
print("---TAIL---")
print(t[-600:])
key = f"EXP-{exp}"
print("BYTES", len(b), "K", t.count(key), "DONE", t.count("DONE"))
print("UART", "PASS" if t.count(key) == 1 and t.count("DONE") == 1 else "FAIL")
PY
echo DONE
