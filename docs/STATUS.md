# STATUS — GU140 NFC foundation

**Mission:** OpenVusionHack-native NFC (RPi TWN4 → NTAG I²C Plus → CC2510 → existing EPD)  
**Branch:** `research/nfc-gu140`  
**Target:** DEV tag only.

## Now

`v0.10e_nfc_show3` (EXP-054): SHOW **1** OpenVusionHack, **2** BWR test 01–16, **3** Shut up and take my money. Menu: `python3 tools/nfc_gateway/show_app.py` or `/home/hw/bin/ov26-nfc-show.sh`.

## NFC ladder

| Step | EXP | Result |
|---|---|---|
| 0 TWN4 UID/GET_VERSION | 038 | **PASS** UID `04367F5A2D7280` |
| A I2C ACK 0xAA | 040 | **PASS** ACK0=01 |
| B session 0xFE read | 043/044 | FAIL ACKAB=00 |
| B′ EEPROM I2C read | 049 | **PASS** ACKAB=01 block 0x01 |
| C FD + LED | 045/046 | idle FD=1; human: UID + two blinks (pulse); 1 Hz sticky on v0.7b |
| C′ FD → EPD | 047 | **PASS** human refresh + UART `HB BUSY=1` |
| C″ NFC show 1/2/3 | 054 | **PASS** v0.10e menu |
| D SRAM mailbox | — | gated on ACKAB |
