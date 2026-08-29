#!/usr/bin/env bash
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
SEND=/home/hw/OpenVusion26_FW/tools/tag-send-image
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT
python3 -c 'open("/tmp/ovmb_bad_11247.bin","wb").write(b"\x00"*11247)'
set +e
"$SEND" /tmp/ovmb_bad_11247.bin > /tmp/ov26_exp070_bad.txt 2>&1
brc=$?
set -e
echo "NEG_RC=$brc"
[[ "$brc" -ne 0 ]]
grep -q 11247 /tmp/ov26_exp070_bad.txt
echo NEG_OK
set +e
"$SEND" /tmp/ovhack.bin --xfer 81 > /tmp/ov26_exp070_send.txt 2>&1
rc=$?
set -e
cat /tmp/ov26_exp070_send.txt
echo "SEND_RC=$rc"
[[ "$rc" -eq 0 ]]
grep -q "DONE" /tmp/ov26_exp070_send.txt
echo SEND_OK
"$RELAYS" status
echo EXP070_SEND_DONE
