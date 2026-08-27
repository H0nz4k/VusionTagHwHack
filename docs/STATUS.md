# STATUS — GU140 EPD first refresh

**Mission:** `milestone/epd-first-refresh`  
**Branch:** `research/gu140`  
**Target:** DEV tag only. Debugger isolated at runtime (GPIO27 dh).

## Now

EXP-024 Phase 3 **PASS** (MCU/UART) / **STRONG EVIDENCE** (P1_3 0→1 po H-L-H).

**Ne SPI.** Vyhodnotit EXP-024 před EXP-D (USART0 Alt1 idle).

## Pin map (REFERENCE, not OVĚŘENO identity)

```text
P0_0 PWR  P0_1 CS  P0_3 MOSI  P0_5 SCLK
P1_2 DC   P1_3 BUSY  P2_0 RESET
P0_2 input/untouched
```

P1_3 po isolated H-L-H: 0→1. Silná evidence kandidáta BUSY, polarita/command ještě ne.

## Ladder

| Step | EXP | Result |
|---|---|---|
| A passive BUSY | 022 | PASS MCU / INCONCLUSIVE identity |
| B PWR only | 023 | PASS MCU / INCONCLUSIVE CoG power |
| C RESET H-L-H | 024 | PASS MCU; P1_3 0→1 po H2; no storm |
| D SPI idle | — | blocked until EXP-024 eval |
| E 0x00/0x0E | — | |
| F min init | — | |
| G blank FB | — | |
| H 0x12 refresh | — | |
