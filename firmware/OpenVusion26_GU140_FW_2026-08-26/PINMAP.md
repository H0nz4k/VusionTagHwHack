# OpenVusion 2.6 BWR GU140 — working pin map

This table intentionally separates facts from hypotheses.

| CC2510 | Physical pin | Candidate function | Confidence / basis |
|---|---:|---|---|
| P0_0 | 5 | EPD board power, active LOW | REFERENCE — GL340 + Pervasive power switch; not OVĚŘENO here |
| P0_1 | 6 | EPD CS# | REFERENCE — GL340 + E2266JS0C2 FPC 12 |
| P0_2 | 7 | unused for first refresh; leave input | out of scope — do not drive |
| P0_3 | 8 | EPD MOSI | REFERENCE — USART0 Alt1 + FPC 14 SDA |
| P0_4 | 9 | NFC SDA | RELATED-MODEL |
| P0_5 | 11 | EPD SCLK | REFERENCE — USART0 Alt1 + FPC 13 SCL |
| P0_6 | 12 | NFC SCL | RELATED-MODEL |
| P0_7 | 13 | unknown / likely unused | Medium |
| P2_0 | 14 | EPD RESET# candidate | REFERENCE — GL340 + FPC 10. Historical reset storm is **not** a pin property; causality UNKNOWN |
| P2_1 | 15 | DD debug data; LED control | Debug + LED **verified on our board** |
| P2_2 | 16 | DC debug clock; LED boost | Debug + LED **verified on our board** |
| P2_3 | 17 | 32.768-kHz crystal | **Verified by continuity on our board** |
| P2_4 | 18 | 32.768-kHz crystal | **Verified by continuity on our board** |
| P1_7 | 32 | external flash MISO | RELATED-MODEL |
| P1_6 | 33 | external flash MOSI; diagnostic UART1 TX | UART **verified**; flash RELATED-MODEL |
| P1_5 | 34 | external flash SCLK | RELATED-MODEL |
| P1_4 | 35 | external flash CS# | RELATED-MODEL |
| P1_3 | 36 | EPD BUSY (ready HIGH) | REFERENCE — GL340 + FPC 9; HIL identity INCONCLUSIVE |
| P1_2 | 1 | EPD D/C | REFERENCE — GL340 + FPC 11 (no longer “boards disagree” vs GL340) |
| P1_1 | 3 | NFC FD / LED-related on other revisions | RELATED-MODEL |
| P1_0 | 4 | NFC/flash power | RELATED-MODEL |

## Hard rule

Do not scan or repurpose `P2_3` / `P2_4`; they are the 32.768-kHz crystal pins on the measured GU140 board.

## Stage policy

- First write/refresh GPIO: P0_0, P0_1, P0_3, P0_5, P1_2, P1_3, P2_0 only. Leave P0_2 input.
- EXP-A…H ladder in `docs/EPD_REFERENCE.md`; one commit per layer.
