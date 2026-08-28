# STATUS — GU140 EPD first refresh

**Mission:** `milestone/epd-first-refresh`  
**Branch:** `research/gu140`  
**Target:** DEV tag only. Debugger isolated at runtime (GPIO27 dh).

## Now

EXP-026 Phase E **PASS** (UART/TX) / **INCONCLUSIVE** (BUSY po `0x00`/`0x0E` se nezměnil).

Další: ne `0x12`. Vyhodnotit před EXP-F min init.

## Pin map (REFERENCE, not OVĚŘENO identity)

```text
P0_0 PWR  P0_1 CS  P0_3 MOSI  P0_5 SCLK
P1_2 DC   P1_3 BUSY  P2_0 RESET
P0_2 input/untouched
```

## Ladder

| Step | EXP | Result |
|---|---|---|
| A passive BUSY | 022 | PASS MCU / INCONCLUSIVE identity |
| B PWR only | 023 | PASS MCU / INCONCLUSIVE CoG power |
| C RESET H-L-H | 024 | PASS MCU; P1_3 0→1 po H2; no storm |
| D SPI idle | 025 | PASS config; map ne OVĚŘENO |
| E 0x00/0x0E | 026 | PASS TX; BUSY stayed 1 |
| F min init | — | |
| G blank FB | — | |
| H 0x12 refresh | — | |
