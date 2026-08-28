#!/usr/bin/env bash
set -euo pipefail
SECS="${1:-12}"
RELAYS=/home/hw/bin/ov26-relays.sh
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
OUT=/tmp/ov26_exp056_recap.bin
"$RELAYS" idle
sleep 0.4
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
timeout 1 cat "$UART" >/dev/null 2>&1 || true
sleep 0.4
: > "$OUT"
timeout "$SECS" cat "$UART" >> "$OUT" &
CAP=$!
sleep 1
"$RELAYS" tag-on
set +e
wait "$CAP"
set -e
python3 - "$OUT" <<'PY'
from pathlib import Path
import sys
b = Path(sys.argv[1]).read_bytes()
t = b.decode("ascii", "replace")
print(t[:2500])
print("BYTES", len(b), "v0.10g", t.count("v0.10g"), "SHOW4", t.count("SHOW4"), "ARMED", t.count("ARMED"))
PY
echo "TAG ON"
