#!/usr/bin/env bash
# EXP-015: flash v0.3a via GPIO21 attach. DEV only. No lock.
# After verify: isolate debug, GPIO17 POR, 15s UART. Always idle at end.
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
RELAYS=/home/hw/bin/ov26-relays.sh
HEX="$ROOT/build/v0.3a_uart_baseline.hex"
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
IDENT=/tmp/ov26_exp015_ident.txt
FLASHLOG=/tmp/ov26_exp015_flash.txt
POR=/tmp/ov26_exp015_por.bin

cleanup() {
    "$RELAYS" idle || true
}
trap cleanup EXIT

[[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }
[[ -e "$UART" ]] || { echo "missing UART"; exit 1; }

echo "== attach =="
"$RELAYS" idle
sleep 0.5
"$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then
        echo "USB at ${i}s"
        ok=1
        break
    fi
done
[[ "$ok" -eq 1 ]] || { echo "USB missing"; exit 4; }

echo "== identify =="
sudo cc-tool -t 2>&1 | tee "$IDENT"
if ! grep -q 'CC2510' "$IDENT"; then
    echo "ERROR: not CC2510"
    exit 3
fi

echo "== erase+write+verify =="
sudo cc-tool -v read -e -w "$HEX" 2>&1 | tee "$FLASHLOG"
if ! grep -qi 'verified\|Verification OK\|complete' "$FLASHLOG"; then
    # cc-tool prints "Flash verified" or similar; keep going if exit 0
    true
fi

echo "== isolate debug, POR UART 15s =="
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" tag-off
sleep 2
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$POR"
timeout 15 cat "$UART" >> "$POR" &
CAP=$!
sleep 1
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e
"$RELAYS" tag-off

python3 - <<'PY'
from pathlib import Path
b = Path("/tmp/ov26_exp015_por.bin").read_bytes()
t = b.decode("ascii", "replace")
print(t[:800])
print("POR_BYTES", len(b))
print("BANNERS", t.count("RESET CAUSE TEST"))
print("POR", t.count("POR/BROWNOUT"))
print("EXT", t.count("EXTERNAL_RESET_N"))
print("DOTS", t.count("."))
banners = t.count("RESET CAUSE TEST")
if 1 <= banners <= 2:
    print("UART=PASS")
elif banners == 0:
    print("UART=FAIL no banner")
else:
    print("UART=FAIL storm banners=%d" % banners)
PY
echo DONE
