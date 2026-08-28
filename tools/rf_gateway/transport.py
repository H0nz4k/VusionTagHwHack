"""SPI backends. Hardware backend refuses to guess BCM pins."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import List, Optional, Sequence


class MockSpi:
    """In-memory CC2500-ish register file for unit tests."""

    def __init__(self):
        self.regs = {i: 0x00 for i in range(0x40)}
        self.regs[0x30] = 0x80  # typical CC2500 PARTNUM REFERENCE
        self.regs[0x31] = 0x03
        self.regs[0x35] = 0x01  # IDLE
        self.regs[0x34] = 0x80
        self.ready = True
        self.log: List[List[int]] = []
        self.patable = [0x00]

    def xfer(self, data: Sequence[int], timeout_s: float = 0.2) -> List[int]:
        del timeout_s
        b = [x & 0xFF for x in data]
        self.log.append(b)
        if not b:
            return []
        hdr = b[0]
        status = 0x00 if self.ready else 0x80
        if len(b) == 1:
            # strobe
            cmd = hdr
            if cmd == 0x30:
                self.ready = True
                self.regs[0x35] = 0x01
            elif cmd == 0x36:
                self.regs[0x35] = 0x01
            return [status]
        rw = bool(hdr & 0x80)
        burst = bool(hdr & 0x40)
        addr = hdr & 0x3F
        out = [status]
        if not rw:
            if addr == 0x3E:
                self.patable = list(b[1:])
                out.extend([status] * (len(b) - 1))
                return out
            if burst:
                for i, v in enumerate(b[1:]):
                    self.regs[(addr + i) & 0x3F] = v
                out.extend([status] * (len(b) - 1))
                return out
            self.regs[addr] = b[1]
            out.append(status)
            return out
        # read
        n = len(b) - 1
        if burst or addr >= 0x30:
            for i in range(n):
                out.append(self.regs[(addr + i) & 0x3F])
            return out
        out.append(self.regs[addr])
        out.extend([0] * (n - 1))
        return out[: len(b)]


def load_config(path: Optional[str] = None) -> dict:
    env_path = path or os.environ.get("OVH_RF_CONFIG")
    cfg = {
        "spi_bus": os.environ.get("OVH_SPI_BUS"),
        "spi_dev": os.environ.get("OVH_SPI_DEV"),
        "spi_cs": os.environ.get("OVH_SPI_CS"),
        "gdo0_bcm": os.environ.get("OVH_GDO0_BCM"),
        "gdo2_bcm": os.environ.get("OVH_GDO2_BCM"),
        "reset_bcm": os.environ.get("OVH_CC2500_RESET_BCM"),
        "spi_hz": int(os.environ.get("OVH_SPI_HZ", "1000000")),
    }
    if env_path and Path(env_path).is_file():
        cfg.update(json.loads(Path(env_path).read_text(encoding="utf-8")))
    return cfg


def hardware_spi_available() -> bool:
    return any(Path(f"/dev/spidev{b}.{d}").exists() for b in range(0, 3) for d in range(0, 3))


def open_hardware_spi(cfg: dict):
    if cfg.get("spi_bus") is None or cfg.get("spi_dev") is None:
        raise RuntimeError(
            "CC2500 SPI pins are not configured. Set OVH_SPI_BUS/OVH_SPI_DEV "
            "or OVH_RF_CONFIG. Refusing to guess Raspberry Pi header pins."
        )
    import spidev  # type: ignore

    spi = spidev.SpiDev()
    spi.open(int(cfg["spi_bus"]), int(cfg["spi_dev"]))
    spi.max_speed_hz = int(cfg["spi_hz"])
    spi.mode = 0

    class _Bus:
        def xfer(self, data, timeout_s=0.2):
            del timeout_s
            return list(spi.xfer2(list(data)))

    return _Bus()
