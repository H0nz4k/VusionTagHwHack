#!/usr/bin/env python3
"""Bounded UART recap at 115200. No flash. Leaves tag as relays left it."""
from pathlib import Path
import subprocess
import sys
import time

import serial

RELAYS = "/home/hw/bin/ov26-relays.sh"
UART = "/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"
OUT = Path("/tmp/ov26_exp056_pyserial.bin")
SECS = 12.0


def relays(*args: str) -> None:
    subprocess.check_call([RELAYS, *args])


def main() -> int:
    relays("idle")
    time.sleep(0.5)
    buf = bytearray()
    try:
        ser = serial.Serial(UART, 115200, timeout=0.2, exclusive=True)
    except Exception as e:
        print("OPEN_FAIL", e)
        relays("tag-on")
        return 1
    with ser:
        ser.reset_input_buffer()
        time.sleep(0.3)
        ser.reset_input_buffer()
        relays("tag-on")
        deadline = time.monotonic() + SECS
        while time.monotonic() < deadline:
            chunk = ser.read(256)
            if chunk:
                buf.extend(chunk)
    OUT.write_bytes(bytes(buf))
    t = bytes(buf).decode("ascii", "replace")
    print(t[:2500])
    print(
        "BYTES",
        len(buf),
        "v0.10g",
        t.count("v0.10g"),
        "SHOW4",
        t.count("SHOW4"),
        "ARMED",
        t.count("ARMED"),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
