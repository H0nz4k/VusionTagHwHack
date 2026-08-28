# STATUS — GU140 RF foundation

**Mission:** OpenVusionHack-native 2.4 GHz link (not Vusion clone)  
**Branch:** `research/rf-gu140`  
**Target:** DEV tag only.

## Now

RF-A/B/C **PASS UART** on DEV CC2510. RF-D UART FAIL (TX not proven). CC2500 **absent**. EPD baseline frozen (`milestone/display-first-content`). `v0.4k_bwr_19` / `v0.4l_ovhack` not modified.

## RF ladder

| Step | EXP | Result |
|---|---|---|
| A dump | 034 | **PASS** silicon defaults, IDLE, no TX |
| B IDLE init | 035 | **PASS** profile readback MATCH, CAL, IDLE |
| C RX/RSSI | 036 | **PASS** MARC=RX, RSSI moved, no overflow |
| D TX ping | 037 | FAIL UART / OTA NOT VERIFIED |
| E CC2500 probe | — | hardware missing |
| G first packet | — | not started |

## Display (unchanged)

EXP-033 OpenVusionHack **OVĚŘENO vizuálně**.
