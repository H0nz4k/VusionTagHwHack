#!/usr/bin/env bash
# DEV only. I2C config 0x3A SRAM_MIRROR write. TWN4 off. Isolated recap.
set -euo pipefail
HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.11f_nfc_cfg3a.hex
RELAYS=/home/hw/bin/ov26-relays.sh
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
sudo cc-tool -t | tee /tmp/ov26_exp062_ident.txt
grep -qi locked /tmp/ov26_exp062_ident.txt && { echo "LOCKED — refusing"; "$RELAYS" idle; exit 3; }
grep -q CC2510 /tmp/ov26_exp062_ident.txt || { echo "not CC2510"; "$RELAYS" idle; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp062_flash.txt
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" twn4-off
"$RELAYS" tag-off
sleep 2
echo FLASH_OK
python3 - <<'PY'
from pathlib import Path
import subprocess
import time
import serial

RELAYS = "/home/hw/bin/ov26-relays.sh"
UART = "/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT = Path("/tmp/ov26_exp062_por.bin")
subprocess.check_call([RELAYS, "idle"])
time.sleep(0.5)
buf = bytearray()
ser = serial.Serial(UART, 115200, timeout=0.2, exclusive=True)
with ser:
    ser.reset_input_buffer()
    time.sleep(0.3)
    ser.reset_input_buffer()
    subprocess.check_call([RELAYS, "tag-on"])
    deadline = time.monotonic() + 36.0
    while time.monotonic() < deadline:
        chunk = ser.read(256)
        if chunk:
            buf.extend(chunk)
OUT.write_bytes(bytes(buf))
t = bytes(buf).decode("ascii", "replace")
print(t[:3500])
print("BYTES", len(buf), "CFG3A", t.count("CFG3A"), "DONE", t.count("DONE"))
print("ACK3A=01", "ACK3A=01" in t, "D=01 01 01 01", "D=01 01 01 01" in t)
PY
echo "TAG ON, TWN4 off, debugger isolated."
