# NFC Reference

I²C na GU140 (OVĚŘENO EXP-040+):

```text
P0_4 -> SDA
P0_6 -> SCL
write 0xAA
read  0xAB
```

NTAG I²C Plus 1K na DEV (OVĚŘENO): UID `04367F5A2D7280`, GET_VERSION `00 04 04 05 02 02 13 03`.

## Config vs session (OVĚŘENO EXP-061–063)

NXP NT3H2111: I²C přístup je vždy 16 B blok. Config EEPROM = I²C `0x3A` = NFC `E8`/`E9`. Session = NFC `EC`/`ED` (I²C session window `0xFE` je jiný protokol, EXP-043 ACKAB=00).

| Bajty 0–7 bloku 3Ah | Význam |
|---|---|
| 0 NC_REG | bit1 SRAM_MIRROR, bit6 PTHRU, bit0 TRANSFER_DIR |
| 1 LAST_NDEF_BLOCK | I²C blok |
| 2 SRAM_MIRROR_BLOCK | **I²C blok** `01h`–`34h` (NFC page = blok × 4). Ne NFC stránka. |
| 3–4 WDT_LS / WDT_MS | default `48 08` |
| 5 I2C_CLOCK_STR | default `01` |
| 6 REG_LOCK | bit0 RF, bit1 I²C; jednou 1 = navždy |
| 7 RFU | `00` |
| 8–15 | na tomto kusu `00` (padding bloku) |

DEV po EXP-063:

```text
E8 1B 00 10 48
E9 08 01 01 00
REG_LOCK=0x01  → RF config WRITE NAK, I²C config WRITE povolen
SRAM_MIRROR_BLOCK=0x10 → NFC 0x40
```

SRAM I²C `F8..FB` (64 B). S mirrorem RF `0x40`–`0x4F` mapuje na SRAM, dokud je VCC. Bez VCC SRAM zmizí; EEPROM pod `0x40` (I²C `0x10`) zůstává zvlášť.

PTHRU (`NC_REG` bit6) se s mirrorem nesmí kombinovat (NXP). RF session WRITE `0xEC` NAK (EXP-060).

Neprováděj zápisy lock/auth/PWD/UID/CC bez nového oprávnění.
