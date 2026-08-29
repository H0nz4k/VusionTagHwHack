#!/usr/bin/env bash
# EXP-068b: one-variable BUSY wait (100 samples, ready=HIGH). DEV only.
set -euo pipefail
HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.12b_nfc_epd.hex
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
OUT=/tmp/ov26_exp068b_uart.bin
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT

echo "=== EXP-068b flash ==="
"$RELAYS" idle; sleep 0.3; "$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no debugger"; exit 4; }
sudo cc-tool -t | tee /tmp/ov26_exp068b_ident.txt
grep -qi locked /tmp/ov26_exp068b_ident.txt && { echo LOCKED; exit 3; }
grep -q CC2510 /tmp/ov26_exp068b_ident.txt || { echo "not CC2510"; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp068b_flash.txt
"$RELAYS" dbg-off; "$RELAYS" usb-off; "$RELAYS" twn4-off; "$RELAYS" tag-off
sleep 2
echo FLASH_OK

pkill -f "cat $UART" 2>/dev/null || true
sleep 0.2
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout 500 cat "$UART" >> "$OUT" &
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
python3 -u "$CLI" send /tmp/ovmb_a.bin --xfer 60 --wait 16 --process-s 0.22 --no-twn4-gpio
rc=$?
set -e
"$RELAYS" twn4-off
sleep 3
kill "$CAP" 2>/dev/null || true
sleep 0.2
kill -9 "$CAP" 2>/dev/null || true
wait "$CAP" 2>/dev/null || true
echo "SEND_RC=$rc"
python3 - <<'PY'
from pathlib import Path
raw = Path("/tmp/ov26_exp068b_uart.bin").read_bytes()
print("UART_BYTES", len(raw))
for k in (b"INIT=", b"P10=", b"P13=", b"REF=", b"HB BUSY=00", b"HB BUSY=01", b"DONE"):
    print("HIT", k.decode(), raw.count(k))
n = 0
for line in raw.decode("latin1", "replace").splitlines():
    if any(t in line for t in ("INIT=", "P10=", "P13=", "REF=", "HB BUSY=", "VERIFIED", "DONE", "v0.12b", "GOT=")):
        s = "".join(ch if 32 <= ord(ch) < 127 else "." for ch in line)
        if s.strip():
            print("LINE", s[:140])
            n += 1
            if n >= 120:
                break
PY
echo UART_068B_DONE
exit "$rc"
