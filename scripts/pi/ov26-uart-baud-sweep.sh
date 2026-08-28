#!/usr/bin/env bash
# Bounded baud sweep recapture of whatever is already on the DEV tag. No flash.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
cleanup() { "$RELAYS" idle || true; }
trap cleanup EXIT
"$RELAYS" idle
sleep 0.3
for BAUD in 9600 38400 57600 115200 230400; do
    OUT="/tmp/ov26_baud_${BAUD}.bin"
    : > "$OUT"
    stty -F "$UART" "$BAUD" cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
    timeout 6 cat "$UART" >> "$OUT" &
    CAP=$!
    sleep 0.8
    "$RELAYS" tag-on
    set +e
    wait "$CAP"
    set -e
    "$RELAYS" tag-off
    sleep 1
    python3 - "$OUT" "$BAUD" <<'PY'
import sys
from pathlib import Path
b = Path(sys.argv[1]).read_bytes()
baud = sys.argv[2]
t = b.decode("ascii", "replace")
ok = sum(1 for x in b if 32 <= x < 127 or x in (10, 13))
ratio = ok / max(len(b), 1)
print(f"BAUD {baud} BYTES {len(b)} ASCII_RATIO {ratio:.3f} EXP-036 {t.count('EXP-036')} DONE {t.count('DONE')}")
if ratio > 0.5:
    print(t[:500])
PY
done
echo SWEEP_DONE
