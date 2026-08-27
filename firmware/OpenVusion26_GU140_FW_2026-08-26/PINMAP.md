# OpenVusion 2.6 BWR GU140 — working pin map

This table intentionally separates facts from hypotheses.

| CC2510 | Physical pin | Candidate function | Confidence / basis |
|---|---:|---|---|
| P0_0 | 5 | EPD board power, active LOW | High — repeated Imagotag/VUSION designs |
| P0_1 | 6 | EPD CS# | High |
| P0_2 | 7 | EPD MISO / possibly unused by firmware | Medium |
| P0_3 | 8 | EPD MOSI | High — USART0 Alt1 SPI |
| P0_4 | 9 | NFC SDA | Medium/high — related VUSION |
| P0_5 | 11 | EPD SCLK | High — USART0 Alt1 SPI |
| P0_6 | 12 | NFC SCL | Medium/high — related VUSION |
| P0_7 | 13 | unknown / likely unused | Medium |
| P2_0 | 14 | EPD RESET# | High |
| P2_1 | 15 | DD debug data; related board LED control | Debug role verified on our board |
| P2_2 | 16 | DC debug clock; related board LED boost | Debug role verified on our board |
| P2_3 | 17 | 32.768-kHz crystal | **Verified by continuity on our board** |
| P2_4 | 18 | 32.768-kHz crystal | **Verified by continuity on our board** |
| P1_7 | 32 | external flash MISO | Medium/high |
| P1_6 | 33 | external flash MOSI; diagnostic UART1 TX | Medium/high / TI USART1 Alt2 |
| P1_5 | 34 | external flash SCLK | Medium/high |
| P1_4 | 35 | external flash CS# | Medium/high |
| P1_3 | 36 | EPD BUSY | High |
| P1_2 | 1 | EPD D/C **candidate** | Medium/high; related boards disagree on this role |
| P1_1 | 3 | NFC FD / LED-related on other revisions | Medium |
| P1_0 | 4 | NFC/flash power | Medium/high |

## Hard rule

Do not scan or repurpose `P2_3` / `P2_4`; they are the 32.768-kHz crystal pins on the measured GU140 board.

## Stage policy

- v0.3 deliberately does **not** touch P1_2.
- v0.4 and v0.5 drive P1_2 as EPD D/C and are gated behind validation.
