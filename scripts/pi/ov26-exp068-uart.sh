#!/usr/bin/env bash
# EXP-068 UART recap: power-cycle, one full image, RF-idle UART extract.
# No reflash. Uses --no-twn4-gpio; this script owns GPIO20.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
OUT=/tmp/ov26_exp068_uart.bin
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT

"$RELAYS" idle
sleep 0.4
# free UART if a previous timeout cat is still holding it
pkill -f "cat $UART" 2>/dev/null || true
sleep 0.2
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout 420 cat "$UART" >> "$OUT" &
CAP=$!
sleep 0.3
"$RELAYS" tag-on
sleep 1.5
"$RELAYS" twn4-on
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if lsusb | grep -q '09d8:0420'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no TWN4"; exit 4; }

set +e
python3 -u "$CLI" send /tmp/ovmb_a.bin --xfer 50 --wait 16 --process-s 0.22 --no-twn4-gpio
rc=$?
set -e
"$RELAYS" twn4-off
sleep 2.5
kill "$CAP" 2>/dev/null || true
sleep 0.3
kill -9 "$CAP" 2>/dev/null || true
wait "$CAP" 2>/dev/null || true
echo "SEND_RC=$rc"
python3 - <<'PY'
from pathlib import Path
raw = Path("/tmp/ov26_exp068_uart.bin").read_bytes()
Path("/tmp/ov26_exp068_uart.txt").write_bytes(raw)
print("UART_BYTES", len(raw))
keys = (b"INIT=", b"P10=", b"P13=", b"REF=", b"HB BUSY=", b"DONE", b"ERROR",
        b"TRANSFER", b"VERIFIED", b"REFRESH", b"READY", b"v0.12b", b"GOT=")
for k in keys:
    print("HIT", k.decode(), raw.count(k))
text = raw.decode("latin1", "replace")
n = 0
for line in text.splitlines():
    if any(t in line for t in ("INIT=", "P10=", "P13=", "REF=", "HB BUSY=", "GOT=",
                               "v0.12b", "READY", "TRANSFER", "VERIFIED", "REFRESH",
                               "DONE", "ERROR", "ABORT", "RESET_CAUSE")):
        s = "".join(ch if 32 <= ord(ch) < 127 else "." for ch in line)
        if s.strip():
            print("LINE", s[:140])
            n += 1
            if n >= 80:
                print("LINE ...truncated...")
                break
PY
echo UART_RECAP_DONE
exit "$rc"
