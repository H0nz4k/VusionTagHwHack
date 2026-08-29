#!/usr/bin/env bash
# EXP-065: I2C-idle window, RF 64 B, then MCU dump F8–FB. DEV only.
set -euo pipefail
HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.11i_nfc_sramwait.hex
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT
[[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }

echo "=== EXP-065 flash ==="
"$RELAYS" idle; sleep 0.3; "$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no debugger"; exit 4; }
sudo cc-tool -t | tee /tmp/ov26_exp065_ident.txt
grep -qi locked /tmp/ov26_exp065_ident.txt && { echo "LOCKED"; exit 3; }
grep -q CC2510 /tmp/ov26_exp065_ident.txt || { echo "not CC2510"; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp065_flash.txt
"$RELAYS" dbg-off; "$RELAYS" usb-off; "$RELAYS" twn4-off; "$RELAYS" tag-off
sleep 2
echo FLASH_OK

python3 - <<'PY'
from pathlib import Path
import subprocess, time, serial
R='/home/hw/bin/ov26-relays.sh'
CLI='/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py'
UART='/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0'

def relays(*a):
    subprocess.check_call([R,*a])

relays('idle'); time.sleep(0.5)
relays('tag-on'); time.sleep(1.2)
relays('twn4-on')
ok=False
for _ in range(10):
    r=subprocess.run(['lsusb'],capture_output=True,text=True)
    if '09d8:0420' in r.stdout:
        ok=True; break
    time.sleep(1)
print('TWN4_USB', ok)
p=subprocess.run(['python3','-u',CLI,'mbox-mirror','--phase','payload64','--wait','16'],capture_output=True,text=True,timeout=28)
Path('/tmp/ov26_exp065_payload.txt').write_text(p.stdout+p.stderr)
print((p.stdout+p.stderr)[-2000:])
relays('twn4-off')
time.sleep(2.0)
buf=bytearray()
ser=serial.Serial(UART,115200,timeout=0.2,exclusive=True)
with ser:
    ser.reset_input_buffer(); time.sleep(0.3); ser.reset_input_buffer()
    deadline=time.monotonic()+22.0
    while time.monotonic()<deadline:
        c=ser.read(256)
        if c: buf.extend(c)
Path('/tmp/ov26_exp065_sram.bin').write_bytes(bytes(buf))
t=bytes(buf).decode('ascii','replace')
Path('/tmp/ov26_exp065_sram.txt').write_text(t)
print(t[:4000])
print('BYTES',len(buf),'READY',t.count('READY'),'TRANSFER',t.count('TRANSFER'),'DONE',t.count('DONE'))
print('SEQ00','00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F' in t)
print('SEQ10','10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F' in t)
print('SEQ20','20 21 22 23 24 25 26 27 28 29 2A 2B 2C 2D 2E 2F' in t)
print('SEQ30','30 31 32 33 34 35 36 37 38 39 3A 3B 3C 3D 3E 3F' in t)
PY
echo "=== EXP-065 done ==="
