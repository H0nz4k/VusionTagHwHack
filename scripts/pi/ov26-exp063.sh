#!/usr/bin/env bash
# EXP-063 DEV only. 16-byte I2C RMW of NTAG config 0x3A (SRAM_MIRROR).
# TWN4 off during EEPROM write. Fail-safe: twn4-off + idle.
set -euo pipefail

HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.11g_nfc_cfg3a_16b.hex
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

echo "=== EXP-063 flash ==="
"$RELAYS" idle
sleep 0.3
"$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no debugger"; exit 4; }
sudo cc-tool -t | tee /tmp/ov26_exp063_ident.txt
grep -qi locked /tmp/ov26_exp063_ident.txt && { echo "LOCKED — refusing"; exit 3; }
grep -q CC2510 /tmp/ov26_exp063_ident.txt || { echo "not CC2510"; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp063_flash.txt
"$RELAYS" dbg-off
"$RELAYS" usb-off
"$RELAYS" twn4-off
"$RELAYS" tag-off
sleep 2
echo FLASH_OK

python3 - <<'PY'
from pathlib import Path
import json
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
    print(t[:4500])
    print("BYTES", len(buf), "v0.11g", t.count("v0.11g"), "PRE3A", t.count("PRE3A"),
          "WR ", t.count("WR "), "POST3A", t.count("POST3A"), "DONE", t.count("DONE"),
          "63 A5", "63 A5" in t)
    return t


def twn4_on_wait():
    relays("twn4-on")
    for _ in range(10):
        r = subprocess.run(["lsusb"], capture_output=True, text=True)
        if "09d8:0420" in r.stdout:
            return True
        time.sleep(1)
    return False


def peek_with_retries():
    """Three distinct bounded tries: order, TWN4 cycle, clean POR."""
    attempts = []

    def run_peek(label):
        p = subprocess.run(
            ["python3", "-u", CLI, "peek", "--wait", "12"],
            capture_output=True, text=True, timeout=22,
        )
        text = (p.stdout or "") + (p.stderr or "")
        attempts.append({"label": label, "rc": p.returncode, "out": text[-2500:]})
        print("---PEEK", label, "rc", p.returncode)
        print(text[-2500:])
        if p.returncode == 0 and "no_tag" not in text:
            Path("/tmp/ov26_exp063_peek.json").write_text(text)
            return True
        return False

    # 1) TAG already on, then TWN4 ON
    relays("tag-on")
    time.sleep(0.4)
    twn4_on_wait()
    if run_peek("tag_then_twn4"):
        return attempts
    relays("twn4-off")
    time.sleep(1)

    # 2) TWN4 power-cycle
    twn4_on_wait()
    if run_peek("twn4_cycle"):
        return attempts
    relays("twn4-off")

    # 3) Clean POR with TWN4 off, then tag then TWN4
    relays("idle")
    time.sleep(2.0)
    relays("tag-on")
    time.sleep(3.0)
    twn4_on_wait()
    run_peek("clean_por")
    return attempts


print("=== EXP-063 first POR UART (I2C RMW, TWN4 off) ===")
t1 = recap("/tmp/ov26_exp063_por.bin", 22.0, power_cycle=True)
Path("/tmp/ov26_exp063_por.txt").write_text(t1)

print("=== EXP-063 session POR then peek ===")
relays("idle")
time.sleep(2.5)
relays("tag-on")
time.sleep(4.0)
attempts = peek_with_retries()
Path("/tmp/ov26_exp063_peek_attempts.json").write_text(json.dumps(attempts, indent=2)[:12000])
relays("twn4-off")
time.sleep(0.4)

print("=== EXP-063 RF payload 0x40 seq, then SRAM recap (no POR) ===")
mbox_log = []
try:
    if not twn4_on_wait():
        mbox_log.append("TWN4_USB_FAIL")
    else:
        p = subprocess.run(
            ["python3", "-u", CLI, "mbox-mirror", "--phase", "payload", "--wait", "16"],
            capture_output=True, text=True, timeout=24,
        )
        mbox_log.append(p.stdout + p.stderr)
except Exception as e:
    mbox_log.append(str(e))
finally:
    subprocess.call([RELAYS, "twn4-off"])
Path("/tmp/ov26_exp063_payload.txt").write_text("".join(mbox_log))
print("".join(mbox_log)[:2500])

print("=== EXP-063 SRAM UART after RF off (VCC held) ===")
t2 = recap("/tmp/ov26_exp063_sram.bin", 16.0, power_cycle=False)
Path("/tmp/ov26_exp063_sram.txt").write_text(t2)
print("PAYLOAD_OVMB_LEFT", "4F 56 4D 42" in t2, "SEQ_63A5", "63 A5" in t2)
PY

echo "=== EXP-063 done; cleanup via trap ==="
