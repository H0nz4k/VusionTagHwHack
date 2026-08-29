#!/usr/bin/env bash
# Peek E8 after I2C 0x3A, then POR + WRITE 0x40 + UART poll. DEV. Bounded.
set -euo pipefail
R=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0

wait_usb() {
    local id="$1" n
    for n in 1 2 3 4 5 6 7 8; do
        if lsusb | grep -q "$id"; then return 0; fi
        sleep 1
    done
    return 1
}

"$R" idle
sleep 0.4
"$R" tag-on
sleep 0.4
"$R" twn4-on
wait_usb '09d8:0420' || { echo "no TWN4 USB"; "$R" idle; exit 4; }
echo "=== PEEK ==="
set +e
python3 -u "$CLI" peek --wait 15 | tee /tmp/ov26_exp062c_peek.json
peekrc=${PIPESTATUS[0]}
set -e
"$R" twn4-off
[[ "$peekrc" -eq 0 ]] || { echo "peek failed rc=$peekrc"; "$R" idle; exit 5; }

echo "=== POR + UART + WRITE 0x40 ==="
"$R" tag-off
sleep 2
python3 - <<'PY'
from pathlib import Path
import subprocess
import threading
import time
import serial

RELAYS = "/home/hw/bin/ov26-relays.sh"
UART = "/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
CLI = "/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py"
OUT = Path("/tmp/ov26_exp062c_por.bin")
subprocess.check_call([RELAYS, "idle"])
time.sleep(2.0)
buf = bytearray()
mbox_log = []

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
            ["python3", "-u", CLI, "mbox-mirror", "--phase", "payload", "--wait", "15"],
            capture_output=True,
            text=True,
            timeout=22,
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
    deadline = time.monotonic() + 40.0
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
"$R" twn4-off
"$R" idle
echo IDLE
