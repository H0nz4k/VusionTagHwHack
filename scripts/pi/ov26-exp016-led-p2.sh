#!/usr/bin/env bash
# EXP-016: flash v0.3f LED P2 test. Isolated runtime. Leave tag ON if UART stable.
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
RELAYS=/home/hw/bin/ov26-relays.sh
HEX="$ROOT/build/v0.3f_led_p2.hex"
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
IDENT=/tmp/ov26_exp016_ident.txt
FLASHLOG=/tmp/ov26_exp016_flash.txt
POR=/tmp/ov26_exp016_por.bin
LEAVE_ON=0

cleanup() {
    if [[ "$LEAVE_ON" != 1 ]]; then
        "$RELAYS" idle || true
    fi
}
trap cleanup EXIT

[[ -f "$HEX" ]] || { echo "missing $HEX — build first"; exit 1; }
[[ -e "$UART" ]] || { echo "missing UART"; exit 1; }

echo "== attach =="
"$RELAYS" idle
sleep 0.4
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

sudo cc-tool -t 2>&1 | tee "$IDENT"
grep -q 'CC2510' "$IDENT" || { echo "not CC2510"; exit 3; }

echo "== flash v0.3f =="
sudo cc-tool -v read -e -w "$HEX" 2>&1 | tee "$FLASHLOG"

echo "== isolate, POR UART 20s =="
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" tag-off
sleep 2
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$POR"
timeout 20 cat "$UART" >> "$POR" &
CAP=$!
sleep 1
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e

python3 - <<'PY'
from pathlib import Path
b = Path("/tmp/ov26_exp016_por.bin").read_bytes()
t = b.decode("ascii", "replace")
print(t[:1200])
print("POR_BYTES", len(b))
print("BANNERS", t.count("v0.3f LED P2 TEST"))
print("LED00", t.count("P2_1=0 P2_2=0"))
print("LED10", t.count("P2_1=1 P2_2=0"))
print("LED01", t.count("P2_1=0 P2_2=1"))
print("LED11", t.count("P2_1=1 P2_2=1"))
print("V03A", t.count("RESET CAUSE TEST"))
banners = t.count("v0.3f LED P2 TEST")
if banners == 1:
    print("UART=PASS")
elif banners == 0:
    print("UART=FAIL no banner")
else:
    print("UART=FAIL storm banners=%d" % banners)
PY

banners=$(python3 -c "from pathlib import Path; print(Path('/tmp/ov26_exp016_por.bin').read_bytes().decode('ascii','replace').count('v0.3f LED P2 TEST'))")
if [[ "$banners" == 1 ]]; then
    LEAVE_ON=1
    "$RELAYS" dbg-off
    "$RELAYS" usb-off
    "$RELAYS" tag-on
    echo "LEFT TAG ON, debug isolated — watch LEDs"
else
    echo "idle after UART fail"
fi
echo DONE
