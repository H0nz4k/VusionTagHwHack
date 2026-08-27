#!/usr/bin/env python3
from pathlib import Path
b = Path("/tmp/ov26_exp010_por.bin").read_bytes()
t = b.decode("ascii", "replace")
print("bytes", len(b))
print("banners", t.count("RESET CAUSE TEST"))
print("POR", t.count("POR/BROWNOUT"))
print("EXT", t.count("EXTERNAL_RESET_N"))
print("WDG", t.count("WATCHDOG"))
print("DOTS", t.count("."))
if t.count("RESET CAUSE TEST"):
    print("ms_per_boot", round(20000 / t.count("RESET CAUSE TEST"), 2))
