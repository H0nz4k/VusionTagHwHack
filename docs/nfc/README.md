# OpenVusionHack NFC

Vlastní 13.56 MHz cesta (ne stock Vusion mailbox):

```text
RPi + ELATEC TWN4 /dev/ttyACM0
    ↓ ISO14443-A
NTAG I²C Plus 1K
    ↓ I2C 0xAA  (P0_4/P0_6 OVĚŘENO ACK)
CC2510 custom FW
    ↓ known-good EPD
OpenVusionHack / later BWR image
```

TWN4 na lab Pi **OVĚŘENO** 2026-08-28: USB `09d8:0420`, `TWN4/B1.64/NCF5.20/PRS1.04`, CDC `/dev/ttyACM0`.  
`/dev/ttyUSB0` = CP2102 UART — **ne** Elatec.

Host: [`tools/nfc_gateway/`](../../tools/nfc_gateway/README.md) + ElaTool `elatec_uid_tool`.

| Fáze | EXP | Status |
|---|---|---|
| NFC-0 RF UID | 038 | **PASS** UID `04367F5A2D7280` Plus 1K |
| NFC-A I2C ACK | 040 | **PASS** ACK0=01, bez P1_0 |
| NFC-B session I2C | 043/044 | FAIL ACKAB=00 (0xFE) |
| NFC-B′ EEPROM I2C | 049 | **PASS** ACKAB=01, EEP non-FF |
| NFC-C FD | 045/046 | idle FD=1; UID + LED pulse; 1 Hz sticky v0.7b |
| NFC-C′ FD → EPD | 047 | **PASS** TWN4 → stripes via FD; UART `HB BUSY=1` |
| NFC-C″ show 1/2/3 | 054 | **PASS** v0.10e: OVH / BWR test / Shut up; menu `ov26-nfc-show.sh` |
| NFC-C‴ show 4 blank | 055 | UART **PASS** v0.10f; volba 4 = bílá |
| NFC-C″″ slot 3 zip | 056 | UART + sklo **PASS** v0.10g; paleta 01–16 viz [`SHOW_SLOTS.md`](SHOW_SLOTS.md) |
| NFC-D SRAM I2C | 057 | **PASS** ACKAB=01 `0xF8` zeros |
| NFC-D RF PTHRU 0xEC | 060 | **FAIL** WRITE EC NAK; F0 timeout |
| NFC-E PING | | pending |
| NFC-F SHOW_DEMO | | pending |
