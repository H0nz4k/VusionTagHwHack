# STATUS — GU140 NFC foundation

**Mission:** OpenVusionHack-native NFC (RPi TWN4 → NTAG I²C Plus → CC2510 → existing EPD)  
**Branch:** `research/nfc-gu140`  
**Target:** DEV tag only.

## Now

`v0.11d` EXP-060: TWN4 na tagu **OVĚŘENO**. RF WRITE session `0xEC` **NAK**. SRAM I2C poll nuly. PTHRU z RF touhle Type-2 WRITE nejde.

Předchozí SHOW: `v0.10e_nfc_show3` (v0.10g) 1 OVH / 2 BWR / 3 Shut up / 4 bílá.

## NFC ladder

| Step | EXP | Result |
|---|---|---|
| 0 TWN4 UID/GET_VERSION | 038 | **PASS** UID `04367F5A2D7280` |
| A I2C ACK 0xAA | 040 | **PASS** ACK0=01 |
| B session 0xFE read | 043/044 | FAIL ACKAB=00 |
| B′ EEPROM I2C read | 049 | **PASS** ACKAB=01 block 0x01 |
| C FD + LED | 045/046 | idle FD=1; human: UID + two blinks (pulse); 1 Hz sticky on v0.7b |
| C′ FD → EPD | 047 | **PASS** human refresh + UART `HB BUSY=1` |
| C″ NFC show 1/2/3 | 054 | **PASS** v0.10e menu; paleta na skle OVĚŘENO |
| C‴ NFC show 4 blank | 055 | UART **PASS** v0.10f; glass pending |
| C″″ slot 3 nový TagStudio | 056 | UART + sklo **PASS** v0.10g |
| D SRAM I2C read | 057 | **PASS** `0xF8` ACKAB=01, data 00 |
| D RF PTHRU 0xEC | 060 | **FAIL** WRITE EC NAK 0x0; F0 timeout |
