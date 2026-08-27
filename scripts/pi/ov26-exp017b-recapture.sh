#!/usr/bin/env bash
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT=/tmp/ov26_exp017b_por.bin
"$RELAYS" idle
sleep 1
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
: > "$OUT"
timeout 20 cat "$UART" >> "$OUT" &
CAP=$!
sleep 1.2
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e
"$RELAYS" idle
python3 - <<'PY'
from pathlib import Path
b = Path("/tmp/ov26_exp017b_por.bin").read_bytes()
t = b.decode("ascii", "replace")
print(t[:1200])
print("BYTES", len(b))
print("G", t.count("v0.3g"))
print("F", t.count("v0.3f"))
print("hex", b[:32].hex())
PY
