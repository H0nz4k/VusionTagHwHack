# STATUS — GU140 NFC foundation

**Mission:** OpenVusionHack-native NFC (RPi TWN4 → NTAG I²C Plus → CC2510 → existing EPD)  
**Branch:** `research/nfc-gu140`  
**Target:** DEV tag only.

## Now

SRAM mailbox **OVĚŘENO** EXP-063/065: RF 64 B seq `00…3F` na NFC `0x40`–`0x4F` = I²C `F8–FB`. Config `E8`=`1B 00 10 48` (mirror I²C blok `0x10`). Firmware `v0.11i_nfc_sramwait`.

Další: mailbox protokol + stream do CoG, refresh `0x12` až po e2e CRC. Ne EEPROM fallback.

Předchozí SHOW: `v0.10e_nfc_show3` (v0.10g).

## NFC ladder

| Step | EXP | Result |
|---|---|---|
| 0 TWN4 UID/GET_VERSION | 038 | **PASS** UID `04367F5A2D7280` |
| A I2C ACK 0xAA | 040 | **PASS** ACK0=01 |
| B session 0xFE read | 043/044 | FAIL ACKAB=00 |
| B′ EEPROM I2C read | 049 | **PASS** ACKAB=01 block 0x01 |
| C″ NFC show 1/2/3 | 054 | **PASS** v0.10e |
| D SRAM I2C read | 057 | **PASS** `0xF8` ACK, nuly |
| D RF PTHRU 0xEC | 060 | **FAIL** NAK |
| D RF WRITE config E8 | 061 | **FAIL** NAK; `REG_LOCK=0x01` |
| D I2C 4 B write 0x3A | 062 | ACK; `E8` unchanged **FAIL** |
| D I2C 16 B RMW 0x3A | 063 | **PASS** SRAM_MIRROR; F8 = 16 B RF |
| D RF 64 B + MCU F8–FB | 065 | **PASS** |
