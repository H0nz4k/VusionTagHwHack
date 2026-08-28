import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJ = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from radio_profile import REGISTERS, WRITE_ORDER

HDR = PROJ / "firmware" / "OpenVusion26_GU140_FW_UART_DIAG" / "common" / "radio_profile.h"


def parse_c_defines(text: str) -> dict:
    out = {}
    for m in re.finditer(r"#define\s+OVH_RF_([A-Z0-9_]+)\s+0x([0-9A-Fa-f]+)", text):
        out[m.group(1)] = int(m.group(2), 16)
    return out


class ProfileConsistency(unittest.TestCase):
    def test_header_matches_python(self):
        self.assertTrue(HDR.is_file(), f"missing {HDR}")
        c = parse_c_defines(HDR.read_text(encoding="utf-8"))
        for name in WRITE_ORDER:
            self.assertIn(name, c, name)
            self.assertEqual(c[name], REGISTERS[name], name)

    def test_strobe_divergence_documented(self):
        text = HDR.read_text(encoding="utf-8")
        self.assertIn("OVH_RFST_SIDLE", text)
        self.assertIn("0x04", text)
