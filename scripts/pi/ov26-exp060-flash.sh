#!/usr/bin/env bash
# DEV only. Flash v0.11d SRAM poll, isolate, UART recap + TWN4 EC PTHRU + F0.
set -euo pipefail
HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.11d_nfc_poll.hex
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
[[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }
"$RELAYS" idle
sleep 0.3
"$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no debugger"; "$RELAYS" idle; exit 4; }
sudo cc-tool -t | tee /tmp/ov26_exp060_ident.txt
grep -qi locked /tmp/ov26_exp060_ident.txt && { echo "LOCKED — refusing"; "$RELAYS" idle; exit 3; }
grep -q CC2510 /tmp/ov26_exp060_ident.txt || { echo "not CC2510"; "$RELAYS" idle; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp060_flash.txt
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" tag-off
sleep 2
echo FLASH_OK
echo "======== PRILOZ TWN4 NA TAG A DRZ ========"
sleep 4
python3 - <<'PY'
from pathlib import Path
import subprocess
import threading
import time
import serial

RELAYS = "/home/hw/bin/ov26-relays.sh"
UART = "/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
CLI = "/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py"
OUT = Path("/tmp/ov26_exp060_por.bin")
subprocess.check_call([RELAYS, "idle"])
time.sleep(0.4)
buf = bytearray()
mbox_log = []

def poke():
    time.sleep(1.2)
    try:
        p = subprocess.run(
            ["python3", "-u", CLI, "mbox", "--wait", "32"],
            capture_output=True,
            text=True,
            timeout=40,
        )
        mbox_log.append(p.stdout + p.stderr)
    except Exception as e:
        mbox_log.append(str(e))

th = threading.Thread(target=poke, daemon=True)
th.start()
ser = serial.Serial(UART, 115200, timeout=0.2, exclusive=True)
with ser:
    ser.reset_input_buffer()
    time.sleep(0.2)
    ser.reset_input_buffer()
    subprocess.check_call([RELAYS, "tag-on"])
    deadline = time.monotonic() + 42.0
    while time.monotonic() < deadline:
        chunk = ser.read(256)
        if chunk:
            buf.extend(chunk)
th.join(timeout=2)
OUT.write_bytes(bytes(buf))
t = bytes(buf).decode("ascii", "replace")
print(t[:4500])
print("---MBOX---")
print("".join(mbox_log)[:3000])
print(
    "BYTES",
    len(buf),
    "POLL",
    t.count("POLL"),
    "ACKAB=01",
    t.count("ACKAB=01"),
    "OVMB",
    "4F 56 4D 42" in t,
    "DONE",
    t.count("DONE"),
)
PY
echo "TAG ON, debugger isolated."
