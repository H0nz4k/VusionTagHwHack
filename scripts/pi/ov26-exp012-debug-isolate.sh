#!/usr/bin/env bash
# EXP-012: GPIO27 now gangs RESET_N+DD+DC. USB 5V is no longer switched.
# Phase A: GPIO27 dh + GPIO17 POR → expect 1 UART banner (like EXP-011).
# Phase B: GPIO27 dl + tag ON → cc-tool -t must see CC2510.
# Bounded: no reflash. Always ends idle. Max ~45 s.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OFF=/tmp/ov26_exp012_tagoff.bin
POR=/tmp/ov26_exp012_por.bin
IDENT=/tmp/ov26_exp012_ident.txt

cleanup() {
    "$RELAYS" idle || true
}
trap cleanup EXIT

"$RELAYS" idle
sleep 1

echo "== PHASE0 idle USB =="
"$RELAYS" status
if lsusb | grep -q '0451:16a2'; then
    echo "USB_DBG=present (expected: USB 5V no longer on GPIO27)"
else
    echo "USB_DBG=absent (unexpected if debugger stays powered)"
fi

test -e "$UART"
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo

: > "$OFF"
timeout 4 cat "$UART" >> "$OFF" || true
echo "TAGOFF_BYTES=$(wc -c < "$OFF")"

echo "== PHASE A POR GPIO27 dh 15s =="
: > "$POR"
timeout 15 cat "$UART" >> "$POR" &
CAP=$!
sleep 1.0
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e

python3 - <<'PY'
from pathlib import Path
b = Path("/tmp/ov26_exp012_por.bin").read_bytes()
t = b.decode("ascii", "replace")
banners = t.count("RESET CAUSE TEST")
print(t[:800])
print("POR_BYTES", len(b))
print("BANNERS", banners)
print("POR", t.count("POR/BROWNOUT"))
print("EXT", t.count("EXTERNAL_RESET_N"))
print("WDG", t.count("WATCHDOG"))
print("DOTS", t.count("."))
if banners == 0:
    print("PHASE_A=FAIL no UART banner")
elif banners <= 2:
    print("PHASE_A=PASS isolated POR")
else:
    print("PHASE_A=FAIL reset storm banners=%d" % banners)
PY

banners=$(python3 -c "from pathlib import Path; print(Path('/tmp/ov26_exp012_por.bin').read_bytes().decode('ascii','replace').count('RESET CAUSE TEST'))")
if (( banners > 5 )); then
    echo "STOP: isolation failed, not connecting debug lines"
    exit 4
fi

echo "== PHASE B dbg-on + cc-tool -t =="
"$RELAYS" dbg-on
sleep 0.4
set +e
timeout 8 sudo cc-tool -t > "$IDENT" 2>&1
cc_rc=$?
set -e
echo "CC_TOOL_RC=$cc_rc"
head -24 "$IDENT" || true

if grep -q 'CC2510' "$IDENT"; then
    echo "PHASE_B=PASS target CC2510"
else
    echo "PHASE_B=FAIL no CC2510"
fi

"$RELAYS" dbg-off
sleep 0.3
"$RELAYS" tag-off
echo "== END =="
"$RELAYS" status
echo DONE
