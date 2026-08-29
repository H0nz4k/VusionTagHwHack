"""HIL send: RF on → write 64 B SRAM → RF off → MCU ACK → RF on. TWN4 stays enumerated."""

from __future__ import annotations

import struct
import time
from typing import Callable

from ovmb import (
    FORMAT_BWR,
    FRAME_LEN,
    IMAGE_LEN,
    Err,
    FType,
    Frame,
    State,
    crc32_iso,
    data_plan,
)

MIRROR = 0x40
DEV_UID = "04367F5A2D7280"
DEV_VER = bytes.fromhex("00 04 04 05 02 02 13 03")


class NtagMailbox:
    def __init__(self, client, ntag, process_s: float = 0.18) -> None:
        self.client = client
        self.ntag = ntag
        self.process_s = process_s
        self.retries = 0

    def rf_off(self) -> None:
        self.client.set_rf_off()

    def rf_on(self, wait_s: float = 4.0):
        deadline = time.monotonic() + wait_s
        tag = None
        while time.monotonic() < deadline:
            tag = self.client.search_tag()
            if tag is not None:
                break
            time.sleep(0.05)
        if tag is None:
            raise RuntimeError("no_tag after RF on")
        self.ntag.get_version()
        self.ntag.pwd_auth(bytes.fromhex("FFFFFFFF"))
        return tag

    def write_frame(self, raw: bytes) -> None:
        if len(raw) != FRAME_LEN:
            raise ValueError("64 B frame")
        for i in range(16):
            self.ntag.write_page(MIRROR + i, raw[i * 4 : i * 4 + 4])

    def read_frame(self) -> bytes:
        return self.ntag.fast_read(MIRROR, MIRROR + 15)

    def exchange(self, fr: Frame, wait: float | None = None) -> Frame:
        self.write_frame(fr.pack())
        self.rf_off()
        time.sleep(self.process_s if wait is None else wait)
        self.rf_on()
        return Frame.unpack(self.read_frame())


def send_image(
    box: NtagMailbox,
    image: bytes,
    xfer_id: int,
    log: Callable[[dict], None],
    fault: str | None = None,
    skip_seq: int | None = None,
    round_timeout_s: float = 8.0,
) -> int:
    if len(image) != IMAGE_LEN:
        log({"event": "ERROR", "error": "bad_bin_len", "n": len(image)})
        return 2
    t0 = time.monotonic()
    ack = box.exchange(Frame(FType.BEGIN, xfer_id, 0, 0, IMAGE_LEN, FORMAT_BWR, b""), wait=10.0)
    log({"event": "BEGIN", "state": ack.payload[0], "err": ack.payload[1]})
    if ack.payload[0] != State.TRANSFER or ack.payload[1] != Err.OK:
        log({"event": "ERROR", "phase": "begin", "ack": ack.payload.hex()})
        return 3
    last_seq = 0
    n_ok = 0
    for seq, off, chunk in data_plan(image):
        if skip_seq is not None and seq == skip_seq:
            continue
        fr = Frame(FType.DATA, xfer_id, seq, off, IMAGE_LEN, FORMAT_BWR, chunk)
        raw = fr.pack()
        if fault == "crc-frame" and seq == 2:
            raw = bytearray(raw)
            raw[20] ^= 0xFF
            box.write_frame(bytes(raw))
            box.rf_off()
            time.sleep(box.process_s)
            box.rf_on()
            ack = Frame.unpack(box.read_frame())
            log({"event": "ERROR", "phase": "crc-frame", "err": ack.payload[1]})
            return 4
        deadline = time.monotonic() + round_timeout_s
        while True:
            if time.monotonic() > deadline:
                log({"event": "ERROR", "phase": "timeout", "seq": seq})
                return 5
            try:
                ack = box.exchange(fr)
                break
            except Exception as e:
                box.retries += 1
                log({"event": "retry", "seq": seq, "error": str(e)})
                time.sleep(0.15)
        if ack.payload[1] != Err.OK:
            log({"event": "ERROR", "phase": "data", "seq": seq, "err": ack.payload[1]})
            return 6
        last_seq = seq
        n_ok += 1
        if n_ok == 1 or n_ok % 40 == 0 or off + len(chunk) == IMAGE_LEN:
            log({"event": "TRANSFER", "chunks": n_ok, "got": off + len(chunk)})
    e2e = crc32_iso(image)
    if fault == "e2e":
        e2e ^= 0xFFFFFFFF
    ack = box.exchange(
        Frame(
            FType.COMMIT,
            xfer_id,
            last_seq + 1,
            IMAGE_LEN,
            IMAGE_LEN,
            FORMAT_BWR,
            struct.pack("<I", e2e),
        ),
        wait=22.0,
    )
    log(
        {
            "event": "COMMIT",
            "state": ack.payload[0],
            "err": ack.payload[1],
            "crc": f"{e2e:08X}",
            "chunks": n_ok,
            "s": round(time.monotonic() - t0, 2),
        }
    )
    st = ack.payload[0]
    if st in (State.VERIFIED, State.REFRESH, State.DONE) and ack.payload[1] == Err.OK:
        if st != State.DONE:
            # MCU may still be in refresh; one more RF off/on to read DONE.
            box.rf_off()
            time.sleep(2.5)
            box.rf_on()
            ack = Frame.unpack(box.read_frame())
            log({"event": "DONE_POLL", "state": ack.payload[0], "err": ack.payload[1]})
        if ack.payload[0] == State.DONE and ack.payload[1] == Err.OK:
            log({"event": "DONE", "crc": f"{e2e:08X}", "retries": box.retries})
            return 0
        if ack.payload[0] in (State.VERIFIED, State.REFRESH) and ack.payload[1] == Err.OK:
            log({"event": "VERIFIED", "crc": f"{e2e:08X}"})
            return 0
    log({"event": "ERROR", "phase": "commit", "state": st, "err": ack.payload[1]})
    return 7


def send_abort(box: NtagMailbox, xfer_id: int) -> Frame:
    return box.exchange(Frame(FType.ABORT, xfer_id, 0, 0, IMAGE_LEN, FORMAT_BWR, b""))
