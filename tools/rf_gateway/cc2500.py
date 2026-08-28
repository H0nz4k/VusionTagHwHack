"""CC2500 SPI driver. All waits are bounded. No GPIO pin defaults."""

from __future__ import annotations

import time
from typing import List, Optional, Protocol, Sequence

from radio_profile import CC2500_SPI_WRITE, CC2500_STROBE, REGISTERS, RSSI_OFFSET_DB

# SWRS040 status register addresses (read with R=1 B=1)
STREG_PARTNUM = 0x30
STREG_VERSION = 0x31
STREG_FREQEST = 0x32
STREG_LQI = 0x33
STREG_RSSI = 0x34
STREG_MARCSTATE = 0x35
STREG_PKTSTATUS = 0x38
STREG_TXBYTES = 0x3A
STREG_RXBYTES = 0x3B

PATABLE = 0x3E
FIFO = 0x3F

MARC_NAMES = {
    0x00: "SLEEP", 0x01: "IDLE", 0x0D: "RX", 0x11: "RX_OVERFLOW",
    0x13: "TX", 0x16: "TX_UNDERFLOW",
}


class SpiXfer(Protocol):
    def xfer(self, data: Sequence[int], timeout_s: float = 0.2) -> List[int]:
        ...


class Cc2500Error(RuntimeError):
    pass


class Timeout(Cc2500Error):
    pass


def rssi_to_dbm(rssi_dec: int, offset: int = RSSI_OFFSET_DB) -> float:
    rssi_dec &= 0xFF
    if rssi_dec >= 128:
        return (rssi_dec - 256) / 2.0 - offset
    return rssi_dec / 2.0 - offset


class Cc2500:
    def __init__(self, spi: SpiXfer, timeout_s: float = 0.2):
        self.spi = spi
        self.timeout_s = timeout_s

    def _xfer(self, payload: Sequence[int]) -> List[int]:
        out = self.spi.xfer(list(payload), timeout_s=self.timeout_s)
        if out is None or len(out) != len(payload):
            raise Cc2500Error("SPI xfer length mismatch")
        return [b & 0xFF for b in out]

    def strobe(self, cmd: int) -> int:
        return self._xfer([cmd & 0xFF])[0]

    def write_reg(self, addr: int, value: int) -> int:
        return self._xfer([addr & 0x3F, value & 0xFF])[0]

    def read_reg(self, addr: int) -> int:
        return self._xfer([0x80 | (addr & 0x3F), 0x00])[1]

    def read_status(self, addr: int) -> int:
        return self._xfer([0xC0 | (addr & 0x3F), 0x00])[1]

    def write_burst(self, addr: int, data: bytes) -> None:
        self._xfer([0x40 | (addr & 0x3F)] + list(data))

    def read_burst(self, addr: int, n: int) -> bytes:
        r = self._xfer([0xC0 | (addr & 0x3F)] + [0] * n)
        return bytes(r[1:])

    def reset(self) -> None:
        self.strobe(CC2500_STROBE["SRES"])
        # crystal + POR; datasheet ~40 µs typical, wait bounded 50 ms
        deadline = time.monotonic() + 0.05
        while time.monotonic() < deadline:
            st = self.strobe(CC2500_STROBE["SNOP"])
            if (st & 0x80) == 0:
                return
            time.sleep(0.001)
        raise Timeout("SRES CHIP_RDYn")

    def partnum(self) -> int:
        return self.read_status(STREG_PARTNUM)

    def version(self) -> int:
        return self.read_status(STREG_VERSION)

    def marcstate(self) -> int:
        return self.read_status(STREG_MARCSTATE) & 0x1F

    def rssi_raw(self) -> int:
        return self.read_status(STREG_RSSI)

    def idle(self) -> None:
        self.strobe(CC2500_STROBE["SIDLE"])
        self._wait_marc(0x01)

    def _wait_marc(self, want: int) -> None:
        deadline = time.monotonic() + self.timeout_s
        last = -1
        while time.monotonic() < deadline:
            last = self.marcstate()
            if last == want:
                return
            time.sleep(0.001)
        raise Timeout(f"MARCSTATE want={want:02X} last={last:02X}")

    def apply_profile(self, regs: Optional[dict] = None) -> None:
        regs = regs or REGISTERS
        for name, addr in CC2500_SPI_WRITE.items():
            self.write_reg(addr, regs[name])
        self.write_burst(PATABLE, bytes([regs["PA_TABLE0"]]))

    def flush_rx(self) -> None:
        self.strobe(CC2500_STROBE["SFRX"])

    def flush_tx(self) -> None:
        self.strobe(CC2500_STROBE["SFTX"])

    def recover(self) -> None:
        self.strobe(CC2500_STROBE["SIDLE"])
        self.flush_rx()
        self.flush_tx()
