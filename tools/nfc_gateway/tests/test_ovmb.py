#!/usr/bin/env python3
"""Mock mailbox protocol tests. No hardware."""

from __future__ import annotations

import struct
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ovmb import (  # noqa: E402
    IMAGE_LEN,
    PAYLOAD_MAX,
    Err,
    FType,
    Frame,
    HostSession,
    McuEngine,
    State,
    crc32_iso,
    data_plan,
    make_test_image,
)


class TestOvmb(unittest.TestCase):
    def test_valid_begin_data_commit(self):
        img = make_test_image(1)
        ack = HostSession(McuEngine(), 7).send_image(img)
        self.assertEqual(ack.payload[0], State.DONE)
        self.assertEqual(ack.payload[1], Err.OK)
        self.assertEqual(struct.unpack("<H", ack.payload[2:4])[0], IMAGE_LEN)

    def test_duplicate_data_idempotent(self):
        img = make_test_image(2)
        mcu = McuEngine()
        host = HostSession(mcu, 3)
        host._round(Frame(FType.BEGIN, 3, 0, 0, IMAGE_LEN, 0xB1, b""))
        seq, off, chunk = data_plan(img)[0]
        fr = Frame(FType.DATA, 3, seq, off, IMAGE_LEN, 0xB1, chunk)
        a1 = host._round(fr)
        a2 = host._round(fr)
        self.assertEqual(a1.payload[0], State.TRANSFER)
        self.assertEqual(a2.payload[0], State.TRANSFER)
        self.assertEqual(a1.payload[1], Err.OK)
        self.assertEqual(mcu.got, len(chunk))

    def test_missing_sequence(self):
        img = make_test_image(3)
        ack = HostSession(McuEngine(), 4).send_image(img, skip_seq=3)
        self.assertEqual(ack.payload[0], State.ERROR)
        self.assertEqual(ack.payload[1], Err.BAD_SEQ)

    def test_bad_offset(self):
        mcu = McuEngine()
        host = HostSession(mcu, 5)
        host._round(Frame(FType.BEGIN, 5, 0, 0, IMAGE_LEN, 0xB1, b""))
        img = make_test_image(4)
        _seq, _off, chunk = data_plan(img)[0]
        ack = host._round(Frame(FType.DATA, 5, 1, 48, IMAGE_LEN, 0xB1, chunk))
        self.assertEqual(ack.payload[1], Err.BAD_OFFSET)

    def test_bad_frame_crc(self):
        ack = HostSession(McuEngine(), 6).send_image(make_test_image(5), fault="crc-frame")
        self.assertEqual(ack.payload[0], State.ERROR)
        self.assertEqual(ack.payload[1], Err.BAD_CRC)

    def test_bad_e2e_crc(self):
        mcu = McuEngine()
        ack = HostSession(mcu, 8).send_image(make_test_image(6), fault="e2e")
        self.assertEqual(ack.payload[0], State.ERROR)
        self.assertEqual(ack.payload[1], Err.BAD_E2E)
        self.assertFalse(mcu.refresh_sent)

    def test_premature_commit(self):
        mcu = McuEngine()
        host = HostSession(mcu, 9)
        host._round(Frame(FType.BEGIN, 9, 0, 0, IMAGE_LEN, 0xB1, b""))
        ack = host._round(
            Frame(FType.COMMIT, 9, 1, 0, IMAGE_LEN, 0xB1, struct.pack("<I", 0))
        )
        self.assertEqual(ack.payload[1], Err.PREMATURE)
        self.assertFalse(mcu.refresh_sent)

    def test_abort_then_ready_via_begin(self):
        mcu = McuEngine()
        host = HostSession(mcu, 10)
        host._round(Frame(FType.BEGIN, 10, 0, 0, IMAGE_LEN, 0xB1, b""))
        ack = host.abort()
        self.assertEqual(ack.payload[0], State.ABORT)
        self.assertFalse(mcu.refresh_sent)
        ack = host._round(Frame(FType.BEGIN, 11, 0, 0, IMAGE_LEN, 0xB1, b""))
        self.assertEqual(ack.payload[0], State.TRANSFER)
        self.assertEqual(mcu.got, 0)

    def test_timeout(self):
        mcu = McuEngine(timeout_idle=2)
        host = HostSession(mcu, 12)
        host._round(Frame(FType.BEGIN, 12, 0, 0, IMAGE_LEN, 0xB1, b""))
        mcu.on_field_off(bytes(64))
        ack = Frame.unpack(mcu.on_field_off(bytes(64)))
        self.assertEqual(ack.payload[0], State.ERROR)
        self.assertEqual(ack.payload[1], Err.TIMEOUT)
        self.assertFalse(mcu.refresh_sent)

    def test_new_begin_recovers_from_error(self):
        mcu = McuEngine()
        host = HostSession(mcu, 13)
        host.send_image(make_test_image(7), fault="crc-frame")
        self.assertEqual(mcu.state, State.ERROR)
        ack = HostSession(mcu, 14).send_image(make_test_image(8))
        self.assertEqual(ack.payload[0], State.DONE)

    def test_last_data_shorter_than_max(self):
        img = make_test_image(9)
        plan = data_plan(img)
        last = plan[-1]
        self.assertLess(len(last[2]), PAYLOAD_MAX)
        self.assertEqual(last[1] + len(last[2]), IMAGE_LEN)
        mcu = McuEngine()
        ack = HostSession(mcu, 15).send_image(img)
        self.assertEqual(ack.payload[0], State.DONE)
        self.assertEqual(mcu.e2e, crc32_iso(img))

    def test_no_refresh_on_error(self):
        mcu = McuEngine()
        HostSession(mcu, 16).send_image(make_test_image(10), fault="e2e")
        self.assertFalse(mcu.refresh_sent)
        self.assertNotEqual(mcu.state, State.DONE)


if __name__ == "__main__":
    unittest.main()
