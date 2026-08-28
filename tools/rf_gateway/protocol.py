"""OpenVusionHack RF v0.1 — pure codec, no GPIO."""

from __future__ import annotations

import struct
from typing import Optional

MAGIC = b"OVH"
VERSION = 1
HEADER_SIZE = 16
MAX_PAYLOAD = 24
MAX_PDU = HEADER_SIZE + MAX_PAYLOAD

TYPE_PING = 0x01
TYPE_PONG = 0x02
TYPE_STATUS_REQ = 0x03
TYPE_STATUS = 0x04
TYPE_ACK = 0x05
TYPE_NACK = 0x06
TYPE_SHOW_DEMO = 0x10
TYPE_IMAGE_BEGIN = 0x11
TYPE_IMAGE_CHUNK = 0x12
TYPE_IMAGE_END = 0x13
TYPE_IMAGE_ABORT = 0x14
TYPE_REFRESH = 0x15
TYPE_SLEEP = 0x16

IMPLEMENTED_TYPES = {
    TYPE_PING, TYPE_PONG, TYPE_STATUS_REQ, TYPE_STATUS, TYPE_ACK, TYPE_NACK,
}
RESERVED_TYPES = {
    TYPE_SHOW_DEMO, TYPE_IMAGE_BEGIN, TYPE_IMAGE_CHUNK, TYPE_IMAGE_END,
    TYPE_IMAGE_ABORT, TYPE_REFRESH, TYPE_SLEEP,
}
ALL_TYPES = IMPLEMENTED_TYPES | RESERVED_TYPES

TYPE_NAME = {
    TYPE_PING: "PING", TYPE_PONG: "PONG", TYPE_STATUS_REQ: "STATUS_REQ",
    TYPE_STATUS: "STATUS", TYPE_ACK: "ACK", TYPE_NACK: "NACK",
    TYPE_SHOW_DEMO: "SHOW_DEMO", TYPE_IMAGE_BEGIN: "IMAGE_BEGIN",
    TYPE_IMAGE_CHUNK: "IMAGE_CHUNK", TYPE_IMAGE_END: "IMAGE_END",
    TYPE_IMAGE_ABORT: "IMAGE_ABORT", TYPE_REFRESH: "REFRESH", TYPE_SLEEP: "SLEEP",
}

FLAG_NEED_ACK = 0x01
FLAG_DUP_REPLY = 0x02
FLAG_SEC_PRESENT = 0x80
FLAG_RESERVED_MASK = 0x7C

ID_INVALID = 0x00000000
ID_DEV_TAG = 0x00000001
ID_GATEWAY = 0x00000002
ID_BROADCAST = 0xFFFFFFFF

NACK_VERSION = 0x01
NACK_DEST = 0x02
NACK_TYPE = 0x03
NACK_LENGTH = 0x04
NACK_BUSY = 0x05
NACK_UNSUPPORTED = 0x06

BROADCAST_OK = {TYPE_PING, TYPE_STATUS_REQ}

_HDR = struct.Struct("<3sBBIIHB")


class ProtocolError(ValueError):
    def __init__(self, code: str, msg: str):
        super().__init__(msg)
        self.code = code


def validate_version(version: int) -> None:
    if version != VERSION:
        raise ProtocolError("version", f"version {version} != {VERSION}")


def validate_destination(dest_id: int, self_id: int, ftype: int) -> None:
    if dest_id == ID_INVALID:
        raise ProtocolError("dest", "dest 0 is invalid")
    if dest_id == ID_BROADCAST:
        if ftype not in BROADCAST_OK:
            raise ProtocolError("dest", "broadcast not allowed for this type")
        return
    if dest_id != self_id:
        raise ProtocolError("dest", "destination mismatch")


def encode_frame(
    ftype: int,
    dest_id: int,
    src_id: int,
    seq: int,
    payload: bytes = b"",
    flags: int = 0,
) -> bytes:
    if ftype not in ALL_TYPES:
        raise ProtocolError("type", f"unknown type 0x{ftype:02X}")
    if flags & FLAG_SEC_PRESENT:
        raise ProtocolError("flags", "SEC_PRESENT not allowed in v0.1")
    if flags & FLAG_RESERVED_MASK:
        raise ProtocolError("flags", "reserved flag bits must be 0")
    if not isinstance(payload, (bytes, bytearray)):
        raise ProtocolError("payload", "payload must be bytes")
    if len(payload) > MAX_PAYLOAD:
        raise ProtocolError("length", f"payload {len(payload)} > {MAX_PAYLOAD}")
    if dest_id == ID_INVALID or src_id == ID_INVALID:
        raise ProtocolError("dest", "id 0 is invalid")
    if not 0 <= seq <= 0xFFFF:
        raise ProtocolError("seq", "seq out of range")
    if dest_id == ID_BROADCAST and ftype not in BROADCAST_OK:
        raise ProtocolError("dest", "broadcast not allowed for this type")
    return _HDR.pack(MAGIC, VERSION, ftype, dest_id, src_id, seq, flags) + bytes(payload)


def decode_frame(data: bytes) -> dict:
    if data is None or len(data) < HEADER_SIZE:
        raise ProtocolError("length", "too short")
    if len(data) > MAX_PDU:
        raise ProtocolError("length", "too long")
    magic, version, ftype, dest_id, src_id, seq, flags = _HDR.unpack(data[:HEADER_SIZE])
    payload = bytes(data[HEADER_SIZE:])
    if magic != MAGIC:
        raise ProtocolError("magic", "bad magic")
    validate_version(version)
    if ftype not in ALL_TYPES:
        raise ProtocolError("type", f"unknown type 0x{ftype:02X}")
    if flags & FLAG_SEC_PRESENT:
        raise ProtocolError("flags", "SEC_PRESENT not allowed in v0.1")
    if flags & FLAG_RESERVED_MASK:
        raise ProtocolError("flags", "reserved flag bits must be 0")
    return {
        "magic": magic,
        "version": version,
        "type": ftype,
        "type_name": TYPE_NAME[ftype],
        "dest_id": dest_id,
        "src_id": src_id,
        "seq": seq,
        "flags": flags,
        "payload": payload,
    }


def encode_ack(dest_id: int, src_id: int, seq: int, acked_type: int, dup: bool = False) -> bytes:
    flags = FLAG_DUP_REPLY if dup else 0
    pl = bytes((acked_type, seq & 0xFF, (seq >> 8) & 0xFF))
    return encode_frame(TYPE_ACK, dest_id, src_id, seq, pl, flags)


def encode_nack(dest_id: int, src_id: int, seq: int, code: int) -> bytes:
    return encode_frame(TYPE_NACK, dest_id, src_id, seq, bytes((code,)))


def encode_ping(dest_id: int, src_id: int, seq: int, nonce: bytes = b"", need_ack: bool = True) -> bytes:
    flags = FLAG_NEED_ACK if need_ack else 0
    return encode_frame(TYPE_PING, dest_id, src_id, seq, nonce, flags)


def encode_pong(dest_id: int, src_id: int, seq: int, nonce: bytes = b"") -> bytes:
    return encode_frame(TYPE_PONG, dest_id, src_id, seq, nonce, 0)


class DuplicateWindow:
    """Last accepted (src, seq) + cached response PDU."""

    def __init__(self):
        self.src: Optional[int] = None
        self.seq: Optional[int] = None
        self.response: Optional[bytes] = None

    def seen(self, src: int, seq: int) -> bool:
        return self.src == src and self.seq == seq

    def remember(self, src: int, seq: int, response: bytes) -> None:
        self.src = src
        self.seq = seq
        self.response = response
