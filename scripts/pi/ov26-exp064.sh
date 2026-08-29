#!/usr/bin/env bash
# EXP-064 DEV only. 64 B SRAM F8–FB. Config already mirrored. TWN4 off at end.
set -euo pipefail

HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.11h_nfc_sram64.hex
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0

cleanup() {
    "$RELAYS" twn4-off || true
    "$RELAYS" idle || true
}
trap cleanup EXIT

[[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }
[[ -e "$UART" ]] || { echo "missing UART $UART"; exit 4; }

echo "=== EXP-064 flash ==="
"$RELAYS" idle
sleep 0.3
"$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no debugger"; exit 4; }
sudo cc-tool -t | tee /tmp/ov26_exp064_ident.txt
grep -qi locked /tmp/ov26_exp064_ident.txt && { echo "LOCKED — refusing"; exit 3; }
grep -q CC2510 /tmp/ov26_exp064_ident.txt || { echo "not CC2510"; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp064_flash.txt
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
CLI = "/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py"
UART = "/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"


def relays(*args):
    subprocess.check_call([RELAYS, *args])


def recap(path, seconds, power_cycle=True):
    buf = bytearray()
    if power_cycle:
        relays("idle")
        time.sleep(0.5)
    ser = serial.Serial(UART, 115200, timeout=0.2, exclusive=True)
    with ser:
        ser.reset_input_buffer()
        time.sleep(0.25)
        ser.reset_input_buffer()
        if power_cycle:
            relays("tag-on")
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            chunk = ser.read(256)
            if chunk:
                buf.extend(chunk)
    Path(path).write_bytes(bytes(buf))
    t = bytes(buf).decode("ascii", "replace")
    print(t[:4000])
    print("BYTES", len(buf), "v0.11h", t.count("v0.11h"), "DONE", t.count("DONE"),
          "F8", t.count(" F8 "), "FB", t.count(" FB "))
    return t


def twn4_on_wait():
    relays("twn4-on")
    for _ in range(10):
        r = subprocess.run(["lsusb"], capture_output=True, text=True)
        if "09d8:0420" in r.stdout:
            return True
        time.sleep(1)
    return False


print("=== EXP-064 boot UART ===")
recap("/tmp/ov26_exp064_por.bin", 14.0, power_cycle=True)

print("=== EXP-064 POR then 64B payload ===")
relays("idle")
time.sleep(2.0)
relays("tag-on")
time.sleep(3.0)
log = []
try:
    if not twn4_on_wait():
        log.append("TWN4_USB_FAIL")
    else:
        p = subprocess.run(
            ["python3", "-u", CLI, "mbox-mirror", "--phase", "payload64", "--wait", "16"],
            capture_output=True, text=True, timeout=28,
        )
        log.append(p.stdout + p.stderr)
        p2 = subprocess.run(
            ["python3", "-u", CLI, "peek", "--wait", "10"],
            capture_output=True, text=True, timeout=20,
        )
        log.append(p2.stdout + p2.stderr)
except Exception as e:
    log.append(str(e))
finally:
    subprocess.call([RELAYS, "twn4-off"])
Path("/tmp/ov26_exp064_payload.txt").write_text("".join(log))
print("".join(log)[:3500])

print("=== EXP-064 SRAM F8-FB after RF off ===")
t2 = recap("/tmp/ov26_exp064_sram.bin", 14.0, power_cycle=False)
want = " ".join(f"{i:02X}" for i in range(16))
print("F8_SEQ00", want in t2)
print("HAS_10_1F", "10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F" in t2)
print("HAS_20_2F", "20 21 22 23 24 25 26 27 28 29 2A 2B 2C 2D 2E 2F" in t2)
print("HAS_30_3F", "30 31 32 33 34 35 36 37 38 39 3A 3B 3C 3D 3E 3F" in t2)
PY

echo "=== EXP-064 done ==="
