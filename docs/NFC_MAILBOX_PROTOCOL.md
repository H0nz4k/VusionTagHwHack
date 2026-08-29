# NFC mailbox protocol OVMB v1

Status: layout **OVĚŘENO** mock testy `tools/nfc_gateway/tests/test_ovmb.py`. HIL viz EXP-066+.

## Physical contract (OVĚŘENO EXP-063/065)

```text
SRAM F8–FB = NFC 0x40–0x4F (SRAM_MIRROR_BLOCK I2C 0x10)
E8 = 1B 00 10 48   E9 = 08 01 01 00
MCU I2C only while RF field is OFF (FD high / TWN4 set_rf_off)
Host: /dev/ttyACM0, GPIO20 on once, RF on/off via SearchTag / SetRFOff
```

BIN: 11 248 B = 5 624 + 5 624, 152×296, 19 B/row. WHITE 0/0, BLACK 1/0, RED 0/1.

## Frame (64 B, little-endian)

| Off | Len | Field |
|---|---|---|
| 0 | 4 | magic `OVMB` |
| 4 | 1 | version `0x01` |
| 5 | 1 | type: BEGIN=1 DATA=2 COMMIT=3 ABORT=4 ACK=5 |
| 6 | 1 | transfer id |
| 7 | 1 | seq (BEGIN=0, DATA=1…N, COMMIT=N+1) |
| 8 | 2 | byte offset |
| 10 | 1 | payload_len 0–48 |
| 11 | 2 | total_len (must be 11248) |
| 13 | 1 | format `0xB1` |
| 14 | 2 | CRC-16/CCITT-FALSE of bytes 0–13 + payload |
| 16 | 48 | payload (unused bytes 0) |

DATA payload max 48 B. 11248 = 234×48 + 16.

COMMIT payload: 4 B CRC-32/ISO-HDLC of the whole image (`binascii.crc32`).

ACK payload: `state, err, got_lo, got_hi`.

## States

READY=0 TRANSFER=1 VERIFIED=2 REFRESH=3 DONE=4 ABORT=5 ERROR=6

## Errors

0 OK, 1 BAD_MAGIC, 2 BAD_VER, 3 BAD_CRC, 4 BAD_SEQ, 5 BAD_OFFSET, 6 BAD_LEN, 7 BAD_FORMAT, 8 PREMATURE, 9 BAD_E2E, 10 TIMEOUT, 11 ABORTED, 12 BAD_TYPE

## Rules

- New BEGIN resets CRC/offset and is allowed from any state.
- Duplicate DATA (same type/id/seq/offset) → same ACK, no double count.
- Wrong seq/offset/CRC/e2e → ERROR, no `0x12`.
- ABORT → ABORT, drop transfer, no `0x12`.
- COMMIT only if got==11248 and e2e matches.
- `0x12` only after VERIFIED.
- MCU timeout in TRANSFER if no new host frame for ~25 s.
