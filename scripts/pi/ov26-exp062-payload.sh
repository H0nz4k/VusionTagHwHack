#!/usr/bin/env bash
# After EXP-062 ACK on 0x3A: NTAG POR, then TWN4 WRITE 0x40 while MCU polls.
set -euo pipefail
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
"$RELAYS" twn4-off
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" tag-off
sleep 2
echo "NTAG POR done. UART + WRITE 0x40."
python3 - <<'PY'
from pathlib import Path
import subprocess
import threading
import time
import serial

RELAYS = "/home/hw/bin/ov26-relays.sh"
UART = "/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
CLI = "/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py"
OUT = Path("/tmp/ov26_exp062b_por.bin")
subprocess.check_call([RELAYS, "idle"])
time.sleep(2.5)
mbox_log = []
buf = bytearray()

def poke():
    time.sleep(2.0)
    try:
        subprocess.check_call([RELAYS, "twn4-on"])
        for _ in range(8):
            r = subprocess.run(["lsusb"], capture_output=True, text=True)
            if "09d8:0420" in r.stdout:
                break
            time.sleep(1)
        p = subprocess.run(
            ["python3", "-u", CLI, "mbox-mirror", "--phase", "payload", "--wait", "20"],
            capture_output=True,
            text=True,
            timeout=28,
        )
        mbox_log.append(p.stdout + p.stderr)
    except Exception as e:
        mbox_log.append(str(e))
    finally:
        subprocess.call([RELAYS, "twn4-off"])

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
print(t[:4000])
print("---MBOX---")
print("".join(mbox_log)[:2500])
print("BYTES", len(buf), "OVMB", "4F 56 4D 42" in t, "CFG3A", "CFG3A" in t, "DONE", t.count("DONE"))
PY
"$RELAYS" twn4-off
echo "TWN4 off, TAG ON."
