"""OpenVusionHack NFC mailbox protocol (OVMB v1).

64-byte SRAM frame. Host and MCU share this layout. Mock MCU is the
software spec; CC2510 firmware must match these constants and rules.
"""

from __future__ import annotations

import binascii
import struct
from dataclasses import dataclass
from enum import IntEnum

IMAGE_LEN = 11248
PLANE_LEN = 5624
FRAME_LEN = 64
HDR_LEN = 16
PAYLOAD_MAX = 48
MAGIC = b"OVMB"
VERSION = 0x01
FORMAT_BWR = 0xB1  # TagStudio 1bpp BWR, 152x296, plane10 then plane13


class FType(IntEnum):
    BEGIN = 1
    DATA = 2
    COMMIT = 3
    ABORT = 4
    ACK = 5


class State(IntEnum):
    READY = 0
    TRANSFER = 1
    VERIFIED = 2
    REFRESH = 3
    DONE = 4
    ABORT = 5
    ERROR = 6


class Err(IntEnum):
    OK = 0
    BAD_MAGIC = 1
    BAD_VER = 2
    BAD_CRC = 3
    BAD_SEQ = 4
    BAD_OFFSET = 5
    BAD_LEN = 6
    BAD_FORMAT = 7
    PREMATURE = 8
    BAD_E2E = 9
    TIMEOUT = 10
    ABORTED = 11
    BAD_TYPE = 12


def crc16_ccitt_false(data: bytes) -> int:
    crc = 0xFFFF
    for b in data:
        crc ^= b << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return crc


def crc32_iso(data: bytes, crc: int = 0) -> int:
    return binascii.crc32(data, crc) & 0xFFFFFFFF


@dataclass
class Frame:
    type: int
    xfer_id: int
    seq: int
    offset: int
    total: int
    fmt: int
    payload: bytes
    version: int = VERSION

    @property
    def plen(self) -> int:
        return len(self.payload)

    def pack(self) -> bytes:
        if self.plen > PAYLOAD_MAX:
            raise ValueError("payload longer than 48")
        hdr = struct.pack(
            "<4sBBBBHBHB",
            MAGIC,
            self.version,
            self.type,
            self.xfer_id & 0xFF,
            self.seq & 0xFF,
            self.offset & 0xFFFF,
            self.plen,
            self.total & 0xFFFF,
            self.fmt & 0xFF,
        )
        # 4s B B B B H B H B = 4+1+1+1+1+2+1+2+1 = 14, then CRC16
        body = hdr + self.payload
        crc = crc16_ccitt_false(body)
        raw = hdr + struct.pack("<H", crc) + self.payload
        return raw + bytes(FRAME_LEN - len(raw))

    @classmethod
    def unpack(cls, raw: bytes) -> "Frame":
        if len(raw) != FRAME_LEN:
            raise ValueError("frame must be 64 bytes")
        magic, ver, typ, xid, seq, off, plen, total, fmt, crc = struct.unpack(
            "<4sBBBBHBHBH", raw[:16]
        )
        payload = raw[16 : 16 + plen]
        expect = crc16_ccitt_false(raw[:14] + payload)
        if magic != MAGIC:
            raise ValueError("magic")
        if crc != expect:
            raise ValueError("crc")
        return cls(typ, xid, seq, off, total, fmt, payload, ver)


def data_plan(image: bytes) -> list[tuple[int, int, bytes]]:
    """Return (seq, offset, payload) for DATA frames."""
    if len(image) != IMAGE_LEN:
        raise ValueError(f"image must be {IMAGE_LEN} bytes")
    out = []
    seq = 1
    off = 0
    while off < IMAGE_LEN:
        chunk = image[off : off + PAYLOAD_MAX]
        out.append((seq, off, chunk))
        off += len(chunk)
        seq += 1
    return out


class McuEngine:
    """Software twin of the CC2510 mailbox parser. Used by unit tests."""

    def __init__(self, timeout_idle: int = 40) -> None:
        self.state = State.READY
        self.err = Err.OK
        self.xfer = 0
        self.last_seq = 0
        self.got = 0
        self.e2e = 0
        self.total = IMAGE_LEN
        self.idle = 0
        self.timeout_idle = timeout_idle
        self.refresh_sent = False
        self.aborted = False
        self.last_host_key: tuple | None = None
        self.sram = bytearray(FRAME_LEN)
        self._ack()

    def _ack(self) -> bytes:
        st = int(self.state)
        er = int(self.err)
        payload = bytes((st, er)) + struct.pack("<H", self.got)
        fr = Frame(
            FType.ACK,
            self.xfer,
            self.last_seq,
            self.got,
            self.total,
            FORMAT_BWR,
            payload,
        )
        raw = fr.pack()
        self.sram[:] = raw
        return raw

    def on_field_off(self, incoming: bytes) -> bytes:
        """Host has RF off. MCU may touch SRAM. Returns ACK frame."""
        self.idle += 1
        if self.state == State.TRANSFER and self.idle >= self.timeout_idle:
            self.state = State.ERROR
            self.err = Err.TIMEOUT
            self.refresh_sent = False
            return self._ack()
        try:
            fr = Frame.unpack(incoming)
        except ValueError as e:
            if incoming[:4] != MAGIC:
                return self._ack()
            self.state = State.ERROR
            self.err = Err.BAD_CRC if "crc" in str(e) else Err.BAD_MAGIC
            return self._ack()
        if fr.type == FType.ACK:
            return self._ack()
        key = (fr.type, fr.xfer_id, fr.seq, fr.offset)
        if key == self.last_host_key and fr.type == FType.DATA:
            return self._ack()
        self.idle = 0
        self._handle(fr)
        self.last_host_key = key
        return self._ack()

    def _handle(self, fr: Frame) -> None:
        if fr.version != VERSION:
            self.state = State.ERROR
            self.err = Err.BAD_VER
            return
        if fr.type == FType.ABORT:
            self.state = State.ABORT
            self.err = Err.ABORTED
            self.refresh_sent = False
            self.got = 0
            self.e2e = 0
            self.aborted = True
            return
        if fr.type == FType.BEGIN:
            if fr.total != IMAGE_LEN or fr.fmt != FORMAT_BWR or fr.offset != 0:
                self.state = State.ERROR
                self.err = Err.BAD_LEN if fr.total != IMAGE_LEN else Err.BAD_FORMAT
                return
            if fr.seq != 0:
                self.state = State.ERROR
                self.err = Err.BAD_SEQ
                return
            self.xfer = fr.xfer_id
            self.last_seq = 0
            self.got = 0
            self.e2e = 0
            self.total = IMAGE_LEN
            self.refresh_sent = False
            self.aborted = False
            self.err = Err.OK
            self.state = State.TRANSFER
            self.last_host_key = None
            return
        if self.state not in (State.TRANSFER,):
            if fr.type in (FType.DATA, FType.COMMIT):
                self.state = State.ERROR
                self.err = Err.BAD_TYPE
            return
        if fr.xfer_id != self.xfer:
            self.state = State.ERROR
            self.err = Err.BAD_SEQ
            return
        if fr.type == FType.DATA:
            expect_seq = (self.last_seq + 1) & 0xFF
            if fr.seq != expect_seq:
                self.state = State.ERROR
                self.err = Err.BAD_SEQ
                return
            if fr.offset != self.got:
                self.state = State.ERROR
                self.err = Err.BAD_OFFSET
                return
            if fr.offset + fr.plen > IMAGE_LEN or fr.plen == 0:
                self.state = State.ERROR
                self.err = Err.BAD_LEN
                return
            self.e2e = crc32_iso(fr.payload, self.e2e)
            self.got += fr.plen
            self.last_seq = fr.seq
            return
        if fr.type == FType.COMMIT:
            if self.got != IMAGE_LEN:
                self.state = State.ERROR
                self.err = Err.PREMATURE
                return
            if fr.plen != 4:
                self.state = State.ERROR
                self.err = Err.BAD_LEN
                return
            want = struct.unpack("<I", fr.payload)[0]
            if want != self.e2e:
                self.state = State.ERROR
                self.err = Err.BAD_E2E
                return
            self.last_seq = fr.seq
            self.state = State.VERIFIED
            self.err = Err.OK
            return
        self.state = State.ERROR
        self.err = Err.BAD_TYPE

    def complete_refresh(self) -> None:
        if self.state == State.VERIFIED:
            self.state = State.REFRESH
            self.refresh_sent = True
            self.state = State.DONE
            self._ack()


class HostSession:
    def __init__(self, mcu: McuEngine, xfer_id: int = 1) -> None:
        self.mcu = mcu
        self.xfer_id = xfer_id

    def _round(self, fr: Frame) -> Frame:
        raw = fr.pack()
        ack = self.mcu.on_field_off(raw)
        return Frame.unpack(ack)

    def send_image(
        self,
        image: bytes,
        fault: str | None = None,
        skip_seq: int | None = None,
    ) -> Frame:
        if len(image) != IMAGE_LEN:
            raise ValueError("bad image length")
        begin = Frame(FType.BEGIN, self.xfer_id, 0, 0, IMAGE_LEN, FORMAT_BWR, b"")
        ack = self._round(begin)
        if ack.payload[0] != State.TRANSFER:
            return ack
        last_seq = 0
        for seq, off, chunk in data_plan(image):
            if skip_seq is not None and seq == skip_seq:
                continue
            fr = Frame(FType.DATA, self.xfer_id, seq, off, IMAGE_LEN, FORMAT_BWR, chunk)
            if fault == "crc-frame" and seq == 2:
                raw = bytearray(fr.pack())
                raw[20] ^= 0xFF
                self.mcu.on_field_off(bytes(raw))
                return Frame.unpack(bytes(self.mcu.sram))
            ack = self._round(fr)
            last_seq = seq
            if ack.payload[1] != Err.OK:
                return ack
        e2e = crc32_iso(image)
        if fault == "e2e":
            e2e ^= 0xFFFFFFFF
        commit = Frame(
            FType.COMMIT,
            self.xfer_id,
            last_seq + 1,
            IMAGE_LEN,
            IMAGE_LEN,
            FORMAT_BWR,
            struct.pack("<I", e2e),
        )
        ack = self._round(commit)
        if ack.payload[0] == State.VERIFIED:
            self.mcu.complete_refresh()
            return Frame.unpack(self.mcu.sram)
        return ack

    def abort(self) -> Frame:
        fr = Frame(FType.ABORT, self.xfer_id, 0, 0, IMAGE_LEN, FORMAT_BWR, b"")
        return self._round(fr)


def make_test_image(seed: int) -> bytes:
    """Deterministic 11248 B TagStudio-layout BIN (plane10 + plane13)."""
    p10 = bytes((seed + i) & 0xFF for i in range(PLANE_LEN))
    p13 = bytes((0xA5 ^ seed ^ i) & 0xFF for i in range(PLANE_LEN))
    return p10 + p13
