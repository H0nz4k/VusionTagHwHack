import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from cc2500 import Cc2500, rssi_to_dbm
from radio_profile import CC2500_STROBE, REGISTERS
from transport import MockSpi


class MockDriver(unittest.TestCase):
    def test_reset_partnum(self):
        m = MockSpi()
        c = Cc2500(m)
        c.reset()
        self.assertEqual(c.partnum(), 0x80)
        self.assertEqual(c.marcstate(), 0x01)

    def test_apply_profile_writes(self):
        m = MockSpi()
        c = Cc2500(m)
        c.apply_profile()
        self.assertEqual(m.regs[0x00], REGISTERS["SYNC1"])
        self.assertEqual(m.regs[0x0C], REGISTERS["MDMCFG4"])
        self.assertEqual(m.patable[0], REGISTERS["PA_TABLE0"])

    def test_strobe_sidle(self):
        m = MockSpi()
        c = Cc2500(m)
        m.regs[0x35] = 0x0D
        c.idle()
        self.assertEqual(c.marcstate(), 0x01)
        self.assertTrue(any(x[0] == CC2500_STROBE["SIDLE"] for x in m.log if x))

    def test_rssi_formula_10k(self):
        self.assertEqual(rssi_to_dbm(0x80), (0x80 - 256) / 2 - 74)
        self.assertEqual(rssi_to_dbm(0x40), 0x40 / 2 - 74)

    def test_xfer_timeout_mismatch(self):
        class Bad:
            def xfer(self, data, timeout_s=0.2):
                return [0]

        with self.assertRaises(Exception):
            Cc2500(Bad()).read_reg(0)
