import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import protocol as p


class EncodeDecode(unittest.TestCase):
    def test_ping_roundtrip(self):
        b = p.encode_ping(p.ID_DEV_TAG, p.ID_GATEWAY, 42, b"AB")
        d = p.decode_frame(b)
        self.assertEqual(d["type"], p.TYPE_PING)
        self.assertEqual(d["seq"], 42)
        self.assertEqual(d["payload"], b"AB")
        self.assertEqual(d["dest_id"], p.ID_DEV_TAG)

    def test_pong_echo(self):
        b = p.encode_pong(p.ID_GATEWAY, p.ID_DEV_TAG, 7, b"xy")
        self.assertEqual(p.decode_frame(b)["type_name"], "PONG")

    def test_ack_and_nack(self):
        a = p.decode_frame(p.encode_ack(p.ID_GATEWAY, p.ID_DEV_TAG, 9, p.TYPE_PING))
        self.assertEqual(a["payload"][0], p.TYPE_PING)
        n = p.decode_frame(p.encode_nack(p.ID_GATEWAY, p.ID_DEV_TAG, 9, p.NACK_TYPE))
        self.assertEqual(n["payload"], bytes((p.NACK_TYPE,)))

    def test_too_short(self):
        with self.assertRaises(p.ProtocolError) as e:
            p.decode_frame(b"OVH")
        self.assertEqual(e.exception.code, "length")

    def test_truncated_header(self):
        with self.assertRaises(p.ProtocolError):
            p.decode_frame(b"OVH" + b"\x00" * 10)

    def test_bad_magic(self):
        b = bytearray(p.encode_ping(p.ID_DEV_TAG, p.ID_GATEWAY, 1))
        b[0] = ord("X")
        with self.assertRaises(p.ProtocolError) as e:
            p.decode_frame(bytes(b))
        self.assertEqual(e.exception.code, "magic")

    def test_invalid_version(self):
        b = bytearray(p.encode_ping(p.ID_DEV_TAG, p.ID_GATEWAY, 1))
        b[3] = 99
        with self.assertRaises(p.ProtocolError) as e:
            p.decode_frame(bytes(b))
        self.assertEqual(e.exception.code, "version")

    def test_invalid_type(self):
        with self.assertRaises(p.ProtocolError) as e:
            p.encode_frame(0x99, p.ID_DEV_TAG, p.ID_GATEWAY, 1)
        self.assertEqual(e.exception.code, "type")
        raw = p.encode_ping(p.ID_DEV_TAG, p.ID_GATEWAY, 1)
        raw = raw[:4] + bytes((0x99,)) + raw[5:]
        with self.assertRaises(p.ProtocolError) as e:
            p.decode_frame(raw)
        self.assertEqual(e.exception.code, "type")

    def test_length_mismatch_payload_too_big(self):
        with self.assertRaises(p.ProtocolError) as e:
            p.encode_ping(p.ID_DEV_TAG, p.ID_GATEWAY, 1, b"x" * 25)
        self.assertEqual(e.exception.code, "length")

    def test_wrong_destination(self):
        d = p.decode_frame(p.encode_ping(0x12345678, p.ID_GATEWAY, 1))
        with self.assertRaises(p.ProtocolError) as e:
            p.validate_destination(d["dest_id"], p.ID_DEV_TAG, d["type"])
        self.assertEqual(e.exception.code, "dest")

    def test_broadcast_ping_ok_show_demo_forbidden(self):
        p.validate_destination(p.ID_BROADCAST, p.ID_DEV_TAG, p.TYPE_PING)
        with self.assertRaises(p.ProtocolError):
            p.encode_frame(p.TYPE_SHOW_DEMO, p.ID_BROADCAST, p.ID_GATEWAY, 1)
        with self.assertRaises(p.ProtocolError):
            p.validate_destination(p.ID_BROADCAST, p.ID_DEV_TAG, p.TYPE_SHOW_DEMO)

    def test_duplicate_window(self):
        w = p.DuplicateWindow()
        self.assertFalse(w.seen(p.ID_GATEWAY, 3))
        resp = p.encode_pong(p.ID_GATEWAY, p.ID_DEV_TAG, 3, b"n")
        w.remember(p.ID_GATEWAY, 3, resp)
        self.assertTrue(w.seen(p.ID_GATEWAY, 3))
        self.assertFalse(w.seen(p.ID_GATEWAY, 4))
        self.assertEqual(w.response, resp)

    def test_sec_flag_rejected(self):
        with self.assertRaises(p.ProtocolError) as e:
            p.encode_frame(p.TYPE_PING, p.ID_DEV_TAG, p.ID_GATEWAY, 1, b"", p.FLAG_SEC_PRESENT)
        self.assertEqual(e.exception.code, "flags")

    def test_id_zero_invalid(self):
        with self.assertRaises(p.ProtocolError):
            p.encode_ping(p.ID_INVALID, p.ID_GATEWAY, 1)


if __name__ == "__main__":
    unittest.main()
