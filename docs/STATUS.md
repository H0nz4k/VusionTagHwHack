# STATUS — GU140 EPD first refresh

**Mission:** `milestone/epd-first-refresh`  
**Branch:** `research/gu140`  
**Target:** DEV tag only. Debugger isolated at runtime (GPIO27 dh).

## Now

EXP-022 Phase 1 **PASS** (MCU/UART) / **INCONCLUSIVE** (BUSY identity).
P1_3 = 0 po isolated POR, bez změny ~20 s. Další: EXP-023 PWR only.

## Pin map (REFERENCE, not OVĚŘENO)

```text
P0_0 PWR  P0_1 CS  P0_3 MOSI  P0_5 SCLK
P1_2 DC   P1_3 BUSY  P2_0 RESET
P0_2 input/untouched
```

## Ladder

| Step | EXP | Result |
|---|---|---|
| A passive BUSY | 022 | PASS MCU / INCONCLUSIVE identity |
| B PWR only | — | |
| C RESET H-L-H | — | |
| D SPI idle | — | |
| E 0x00/0x0E | — | |
| F min init | — | |
| G blank FB | — | |
| H 0x12 refresh | — | |
