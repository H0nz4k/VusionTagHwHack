#!/usr/bin/env bash
# EXP-066: OVMB protocol HIL, no EPD. DEV only. TWN4 on once.
set -euo pipefail
HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.12a_nfc_proto.hex
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
GW=/home/hw/OpenVusion26_FW/tools/nfc_gateway
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT
[[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }

echo "=== EXP-066 flash ==="
"$RELAYS" idle; sleep 0.3; "$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no debugger"; exit 4; }
sudo cc-tool -t | tee /tmp/ov26_exp066_ident.txt
grep -qi locked /tmp/ov26_exp066_ident.txt && { echo LOCKED; exit 3; }
grep -q CC2510 /tmp/ov26_exp066_ident.txt || { echo "not CC2510"; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp066_flash.txt
"$RELAYS" dbg-off; "$RELAYS" usb-off; "$RELAYS" twn4-off; "$RELAYS" tag-off
sleep 2
echo FLASH_OK

python3 - <<PY
import json, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, "$GW")
from ovmb import IMAGE_LEN, make_test_image

R = "/home/hw/bin/ov26-relays.sh"
CLI = "$CLI"
BINA = Path("/tmp/ovmb_a.bin")
BINB = Path("/tmp/ovmb_b.bin")
BINA.write_bytes(make_test_image(1))
BINB.write_bytes(make_test_image(2))
assert BINA.stat().st_size == IMAGE_LEN

def relays(*a):
    subprocess.check_call([R, *a])

def twn4_on():
    relays("twn4-on")
    for _ in range(10):
        r = subprocess.run(["lsusb"], capture_output=True, text=True)
        if "09d8:0420" in r.stdout:
            return True
        time.sleep(1)
    return False

def run_send(binpath, xfer, extra=None):
    cmd = ["python3", "-u", CLI, "send", str(binpath), "--xfer", str(xfer), "--wait", "16", "--process-s", "0.20"]
    if extra:
        cmd.extend(extra)
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=420)
    text = p.stdout + p.stderr
    print(text[-2500:])
    return p.returncode, text

relays("idle")
time.sleep(0.4)
relays("tag-on")
time.sleep(1.0)
assert twn4_on(), "TWN4_USB"
results = {}
try:
    rc, t = run_send(BINA, 1, ["--fault", "crc-frame"])
    results["crc_frame"] = {"rc": rc, "ok": rc != 0 and "ERROR" in t}
    rc, t = run_send(BINA, 2, ["--skip-seq", "3"])
    results["skip"] = {"rc": rc, "ok": rc != 0}
    rc, t = run_send(BINA, 3, ["--fault", "e2e"])
    results["e2e"] = {"rc": rc, "ok": rc != 0}
    rc, t = run_send(BINA, 10)
    results["full_a1"] = {"rc": rc, "ok": rc == 0}
    rc, t = run_send(BINB, 11)
    results["full_b"] = {"rc": rc, "ok": rc == 0}
    rc, t = run_send(BINA, 12)
    results["full_a2"] = {"rc": rc, "ok": rc == 0}
finally:
    subprocess.call([R, "twn4-off"])
Path("/tmp/ov26_exp066_results.json").write_text(json.dumps(results, indent=2))
print("RESULTS", json.dumps(results))
fails = [k for k, v in results.items() if not v["ok"]]
raise SystemExit(1 if fails else 0)
PY
echo "=== EXP-066 done ==="
