# STATUS — GU140 NFC foundation

**Mission:** OpenVusionHack-native NFC (RPi TWN4 → NTAG I²C Plus → CC2510 → existing EPD)  
**Branch:** `research/nfc-gu140`  
**Target:** DEV tag only.

## Now

NFC-0 PASS. NFC-A I2C ACK PASS. NFC-B session read FAIL. NFC-C FD idle HIGH **OVĚŘENO**; RF-field LED demo waits for TWN4 in range. TAG OFF. `v0.7a_nfc_fd_led` is on the DEV tag.

## NFC ladder

| Step | EXP | Result |
|---|---|---|
| 0 TWN4 UID/GET_VERSION | 038 | **PASS** UID `04367F5A2D7280` |
| A I2C ACK 0xAA | 040 | **PASS** ACK0=01 |
| B session 0xFE read | 043/044 | FAIL ACKAB=00 |
| C FD + LED | 045 | idle FD=1; field INCONCLUSIVE (no UID this geometry) |
| D SRAM mailbox | — | gated on ACKAB |
