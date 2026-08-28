# STATUS — GU140 NFC foundation

**Mission:** OpenVusionHack-native NFC (RPi TWN4 → NTAG I²C Plus → CC2510 → existing EPD)  
**Branch:** `research/nfc-gu140`  
**Target:** DEV tag only.

## Now

NFC-0 RF identity **PASS**. NFC-A I2C ACK 0xAA **PASS** (P0_4/P0_6). NFC-B session read **FAIL** (0xAB NACK). EPD baseline frozen. RF TX still unverified. TAG OFF.

Last UART-PASS NFC image on DEV: `v0.6e_nfc_sess2` (ACKAA=01 ACKFE=01 ACKAB=00).

## NFC ladder

| Step | EXP | Result |
|---|---|---|
| 0 TWN4 UID/GET_VERSION | 038 | **PASS** UID `04367F5A2D7280`, Plus 1K |
| A I2C ACK 0xAA | 040 | **PASS** ACK0=01, no P1_0 |
| B session 0xFE read | 043/044 | FAIL ACKAB=00, SESS FF×8 |
| C FD | — | not started |
| D SRAM mailbox | — | gated on ACKAB |
| E/F PING / SHOW_DEMO | — | not started |

## Display / RF (unchanged)

EXP-033 visual **OVĚŘENO**. RF-A/B/C PASS UART. RF-D UART FAIL / OTA not verified. CC2500 absent.
