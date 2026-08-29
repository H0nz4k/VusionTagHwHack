#!/usr/bin/env bash
# EXP-070 HIL: dry-run, flash latest, UART banner, send ovhack, reject bad len, idle.
set -euo pipefail
ROOT=/home/hw/OpenVusion26_FW
FLASH="$ROOT/tools/tag-flash-latest"
SEND="$ROOT/tools/tag-send-image"
RELAYS=/home/hw/bin/ov26-relays.sh
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
OVH=/tmp/ovhack.bin
BAD=/tmp/ovmb_bad_11247.bin
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT

echo "=== dry-run ==="
"$FLASH" --dry-run | tee /tmp/ov26_exp070_dry.txt
grep -q "erase/write neproběhly" /tmp/ov26_exp070_dry.txt
echo DRY_OK

echo "=== flash ==="
"$FLASH" --confirm-dev-tag --yes --verbose | tee /tmp/ov26_exp070_flash.txt
grep -q "verify:      PASS" /tmp/ov26_exp070_flash.txt
echo FLASH_OK

echo "=== UART banner ==="
"$RELAYS" idle
sleep 0.3
stty -F "$UART" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo || true
: > /tmp/ov26_exp070_uart.bin
timeout 8 cat "$UART" >> /tmp/ov26_exp070_uart.bin &
CAP=$!
sleep 0.3
"$RELAYS" tag-on
sleep 3
kill "$CAP" 2>/dev/null || true
wait "$CAP" 2>/dev/null || true
python3 - <<'PY'
from pathlib import Path
raw = Path("/tmp/ov26_exp070_uart.bin").read_bytes()
print("UART_BYTES", len(raw))
ok = b"v0.12b" in raw or b"OVMB-EPD" in raw
print("BANNER", "PASS" if ok else "FAIL")
for line in raw.decode("latin1","replace").splitlines():
    s="".join(ch if 32<=ord(ch)<127 else "." for ch in line)
    if any(t in s for t in ("v0.12b","OVMB","READY","OpenVusion")):
        print("LINE", s[:120])
raise SystemExit(0 if ok else 6)
PY

echo "=== send ovhack ==="
[[ -f "$OVH" ]] || { echo "missing $OVH"; exit 2; }
set +e
"$SEND" "$OVH" --xfer 80 | tee /tmp/ov26_exp070_send.txt
rc=$?
set -e
[[ "$rc" -eq 0 ]]
grep -q "výsledek:    DONE" /tmp/ov26_exp070_send.txt
echo SEND_OK

echo "=== negative len ==="
python3 -c "open('/tmp/ovmb_bad_11247.bin','wb').write(b'\\x00'*11247)"
set +e
"$SEND" "$BAD" | tee /tmp/ov26_exp070_bad.txt
brc=$?
set -e
[[ "$brc" -ne 0 ]]
grep -qi "11247" /tmp/ov26_exp070_bad.txt
echo NEG_OK

"$RELAYS" status
echo EXP070_DONE
