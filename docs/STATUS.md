# STATUS — GU140 EPD first refresh

**Mission:** `milestone/epd-first-refresh`  
**Branch:** `research/gu140`  
**Target:** DEV tag only. Debugger isolated at runtime (GPIO27 dh).

## Now

EXP-030 stripes **PASS UART** + reprodukovaný BUSY 1→0→1. Vizuál čeká člověka. TAG OFF. Milníky: `milestone/epd-first-refresh`, `milestone/display-test-pattern`.

## Ladder

| Step | EXP | Result |
|---|---|---|
| A passive BUSY | 022 | PASS MCU / INCONCLUSIVE identity |
| B PWR only | 023 | PASS MCU / INCONCLUSIVE CoG power |
| C RESET H-L-H | 024 | PASS MCU; P1_3 0→1 po H2; no storm |
| D SPI idle | 025 | PASS config; map ne OVĚŘENO |
| E 0x00/0x0E | 026 | PASS TX; BUSY stayed 1 |
| F min init | 027 | PASS TX |
| G blank FB | 028 | PASS 15F8+15F8 |
| H 0x12 refresh | 029 | PASS UART; BUSY 1→0→1 po 0x12 (~15 s LOW) |
| I B/W stripes | 030 | PASS UART; stejný BUSY cyklus s vlastními daty |
