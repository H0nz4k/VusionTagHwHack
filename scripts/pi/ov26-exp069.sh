#!/usr/bin/env bash
# EXP-069: send known artwork BINs via OVMB. No MCU reflash.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
OVH=/tmp/ovhack.bin
MONEY=/tmp/money.bin
OUT=/tmp/ov26_exp069_uart.bin
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT

[[ -f "$OVH" && -f "$MONEY" ]] || { echo "missing art bins"; exit 2; }

"$RELAYS" idle
sleep 0.4
pkill -f "cat $UART" 2>/dev/null || true
sleep 0.2
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout 900 cat "$UART" >> "$OUT" &
CAP=$!
sleep 0.3
"$RELAYS" tag-on
sleep 1.4

set +e
python3 -u "$CLI" send "$OVH" --xfer 70 --wait 16 --process-s 0.22
rc1=$?
python3 -u "$CLI" send "$MONEY" --xfer 71 --wait 16 --process-s 0.22
rc2=$?
set -e
"$RELAYS" twn4-off
sleep 2.5
kill "$CAP" 2>/dev/null || true
sleep 0.2
kill -9 "$CAP" 2>/dev/null || true
wait "$CAP" 2>/dev/null || true
echo "OVH_RC=$rc1 MONEY_RC=$rc2"
python3 - <<'PY'
from pathlib import Path
raw = Path("/tmp/ov26_exp069_uart.bin").read_bytes()
print("UART_BYTES", len(raw))
for k in (b"INIT=", b"P10=", b"P13=", b"REF=", b"HB BUSY=01", b"DONE", b"ERROR"):
    print("HIT", k.decode(), raw.count(k))
n = 0
for line in raw.decode("latin1", "replace").splitlines():
    if any(t in line for t in ("INIT=", "P10=", "P13=", "REF=", "HB BUSY=01", "VERIFIED", "DONE", "GOT=", "v0.12b")):
        s = "".join(ch if 32 <= ord(ch) < 127 else "." for ch in line)
        if s.strip():
            print("LINE", s[:140])
            n += 1
            if n >= 40:
                break
PY
echo EXP069_DONE
exit $(( rc1 != 0 || rc2 != 0 ))
