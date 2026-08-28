#!/usr/bin/env bash
# Bounded HW inventory after GPIO20 TWN4 relay. No flash. Ends idle.
set -u
R=/home/hw/bin/ov26-relays.sh
ok=0
fail=0
pass() { echo "PASS $1"; ok=$((ok+1)); }
failm() { echo "FAIL $1"; fail=$((fail+1)); }

wait_usb() {
    local id="$1"
    local n
    for n in 1 2 3 4 5 6 7 8; do
        if lsusb | grep -q "$id"; then return 0; fi
        sleep 1
    done
    return 1
}

echo "=== IDLE ==="
"$R" idle
sleep 0.3
lsusb | grep -E '0451:16a2|09d8:0420|10c4:ea60' || true
pinctrl get 17
pinctrl get 27
pinctrl get 21
pinctrl get 20

if pinctrl get 17 | grep -q ' hi ' && pinctrl get 27 | grep -q ' hi ' && pinctrl get 21 | grep -q ' hi ' && pinctrl get 20 | grep -q ' hi '; then
    pass "idle all dh"
else
    failm "idle not all hi"
fi
if lsusb | grep -q '0451:16a2'; then failm "debugger USB still present after idle"; else pass "debugger USB off"; fi
if lsusb | grep -q '09d8:0420'; then failm "TWN4 USB still present after idle"; else pass "TWN4 USB off"; fi
if lsusb | grep -q '10c4:ea60'; then pass "CP2102 UART always-on"; else failm "CP2102 missing"; fi
UART=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
if [[ -e "$UART" ]]; then pass "UART by-id"; else failm "UART by-id missing"; fi

echo "=== usb-on refuse ==="
if "$R" usb-on; then failm "usb-on should refuse when 17/27 off"; else pass "usb-on refused without attach"; fi

echo "=== TWN4 ON ==="
"$R" twn4-on
if wait_usb '09d8:0420'; then pass "TWN4 09d8:0420"; else failm "TWN4 did not enumerate"; lsusb; fi
if [[ -e /dev/ttyACM0 ]]; then pass "ttyACM0"; else failm "no ttyACM0"; ls /dev/ttyACM* 2>/dev/null || true; fi

echo "=== TWN4 OFF ==="
"$R" twn4-off
sleep 2
if lsusb | grep -q '09d8:0420'; then failm "TWN4 still present after twn4-off"; else pass "TWN4 USB gone"; fi

echo "=== ATTACH debugger ==="
"$R" attach
if wait_usb '0451:16a2'; then pass "debugger 0451:16a2"; else failm "debugger did not enumerate"; lsusb; fi
sudo cc-tool -t | tee /tmp/ov26_hw_ident.txt
if grep -q CC2510 /tmp/ov26_hw_ident.txt; then pass "cc-tool CC2510"; else failm "cc-tool no CC2510"; fi
if grep -qi locked /tmp/ov26_hw_ident.txt; then echo "NOTE target LOCKED (not DEV flash)"; else pass "target unlocked"; fi

echo "=== isolate + TAG ON ==="
"$R" dbg-off
"$R" usb-off
"$R" twn4-off
"$R" tag-on
if pinctrl get 17 | grep -q ' lo '; then pass "tag 3V on"; else failm "tag 3V not on"; fi
if pinctrl get 27 | grep -q ' hi '; then pass "debug isolated"; else failm "debug still connected"; fi

echo "=== IDLE end ==="
"$R" idle
sleep 0.2
echo "OK=$ok FAIL=$fail"
if [[ "$fail" -ne 0 ]]; then exit 1; fi
exit 0
