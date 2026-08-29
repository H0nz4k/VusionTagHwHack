# NFC mailbox protocol (64 B SRAM)

Status: physical path **OVĚŘENO** EXP-063/065. Frame layout below is **HYPOTÉZA** until host+MCU tests.

## Physical contract (OVĚŘENO)

```text
I2C 0xAA/0xAB
SRAM blocks F8 F9 FA FB = 64 B
SRAM_MIRROR: NC_REG bit1, SRAM_MIRROR_BLOCK=0x10 (NFC pages 0x40–0x4F)
REG_LOCK=0x01: do not write config via RF; I2C config already programmed
VCC required; SRAM lost on tag power-off
MCU must not I2C-poll while TWN4 writes
Host uses /dev/ttyACM0 only (never ttyUSB0)
```

Polarity (existing EPD, do not change): WHITE 0/0, BLACK 1/0, RED 0/1. BIN = 2 × 5624 B = 11248 B, 152×296, 19 B/row.

## Proposed 64 B frame (HYPOTÉZA)

Byte layout, little-endian:

| Off | Len | Field |
|---|---|---|
| 0 | 4 | magic `OVMB` |
| 4 | 1 | proto ver `0x01` |
| 5 | 1 | type: 1 BEGIN, 2 DATA, 3 COMMIT, 4 ABORT, 5 ACK |
| 6 | 1 | transfer id |
| 7 | 1 | seq (monotonic per transfer) |
| 8 | 2 | byte_offset |
| 10 | 1 | payload_len (0–47) |
| 11 | 2 | total_len (11248) |
| 13 | 1 | plane/format `0xB1` = TagStudio 1bpp BWR native |
| 14 | 2 | frame CRC-16/IBM of bytes 0–13 + payload |
| 16 | 47 | payload |
| 63 | 1 | reserved 0 |

COMMIT payload: 4 B end-to-end CRC-32 of the 11248 B image.

MCU: reject out-of-order seq, offset past plane, bad frame CRC. No EPD `0x12` until COMMIT + e2e CRC. On ABORT/timeout: drop transfer, keep last glass image.

Host: `mbox-mirror --phase payload64` is only a raw SRAM test. Image CLI comes after this layout is locked by a HIL test.
