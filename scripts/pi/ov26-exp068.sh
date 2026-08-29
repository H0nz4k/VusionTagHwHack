#!/usr/bin/env bash
# EXP-067/068: CoG stream + 0x12. DEV only.
set -euo pipefail
HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.12b_nfc_epd.hex
RELAYS=/home/hw/bin/ov26-relays.sh
CLI=/home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py
GW=/home/hw/OpenVusion26_FW/tools/nfc_gateway
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
cleanup() { "$RELAYS" twn4-off || true; "$RELAYS" idle || true; }
trap cleanup EXIT
[[ -f "$HEX" ]] || { echo "missing $HEX"; exit 1; }

echo "=== EXP-068 flash ==="
"$RELAYS" idle; sleep 0.3; "$RELAYS" attach
ok=0
for i in 1 2 3 4 5 6 7 8; do
    sleep 1
    if lsusb | grep -q '0451:16a2'; then ok=1; break; fi
done
[[ "$ok" -eq 1 ]] || { echo "no debugger"; exit 4; }
sudo cc-tool -t | tee /tmp/ov26_exp068_ident.txt
grep -qi locked /tmp/ov26_exp068_ident.txt && { echo LOCKED; exit 3; }
grep -q CC2510 /tmp/ov26_exp068_ident.txt || { echo "not CC2510"; exit 3; }
sudo cc-tool -v read -e -w "$HEX" | tee /tmp/ov26_exp068_flash.txt
"$RELAYS" dbg-off; "$RELAYS" usb-off; "$RELAYS" twn4-off; "$RELAYS" tag-off
sleep 2
echo FLASH_OK

python3 - <<PY
import json, subprocess, time
from pathlib import Path
import sys
sys.path.insert(0, "$GW")
from ovmb import IMAGE_LEN, make_test_image

R="/home/hw/bin/ov26-relays.sh"
CLI="$CLI"
UART="$UART"
BINA=Path("/tmp/ovmb_a.bin")
BINB=Path("/tmp/ovmb_b.bin")
BINA.write_bytes(make_test_image(1))
BINB.write_bytes(make_test_image(2))

def relays(*a):
    subprocess.check_call([R,*a])

def twn4_on():
    relays("twn4-on")
    for _ in range(10):
        r=subprocess.run(["lsusb"],capture_output=True,text=True)
        if "09d8:0420" in r.stdout:
            return True
        time.sleep(1)
    return False

def run_send(binpath, xfer, extra=None, timeout=480):
    cmd=["python3","-u",CLI,"send",str(binpath),"--xfer",str(xfer),"--wait","16","--process-s","0.22"]
    if extra:
        cmd.extend(extra)
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
    print(p.stdout[-2000:])
    print(p.stderr[-500:] if p.stderr else "")
    return p.returncode, p.stdout+p.stderr

relays("idle"); time.sleep(0.4)
relays("tag-on"); time.sleep(1.2)
assert twn4_on()
results={}
try:
    rc,t=run_send(BINA,21,["--fault","crc-frame"], timeout=90)
    results["crc"]= {"rc":rc,"ok":rc!=0}
    rc,t=run_send(BINA,22,["--skip-seq","3"], timeout=90)
    results["skip"]= {"rc":rc,"ok":rc!=0}
    rc,t=run_send(BINA,23,["--fault","e2e"], timeout=480)
    results["e2e"]= {"rc":rc,"ok":rc!=0}
    rc,t=run_send(BINA,30)
    results["img_a"]= {"rc":rc,"ok":rc==0}
    rc,t=run_send(BINB,31)
    results["img_b"]= {"rc":rc,"ok":rc==0}
    rc,t=run_send(BINA,32)
    results["img_a2"]= {"rc":rc,"ok":rc==0}
finally:
    subprocess.call([R,"twn4-off"])
    time.sleep(1)
# UART recap after last transfer: POR would wipe; just note last host result
Path("/tmp/ov26_exp068_results.json").write_text(json.dumps(results,indent=2))
print("RESULTS", json.dumps(results))
raise SystemExit(0 if all(v["ok"] for v in results.values()) else 1)
PY
echo "=== EXP-068 done ==="
