# STATUS — GU140 EPD first refresh

**Mission:** `milestone/display-first-content`  
**Branch:** `research/gu140`  
**Target:** DEV tag only. Debugger isolated at runtime (GPIO27 dh).

## Now

EXP-033 OpenVusionHack **OVĚŘENO vizuálně**: OpenVusion černě, Hack červeně, pozadí bílé. `milestone/display-first-content`. Fotka `captures/ov26_exp033_visual.png`. BWR baseline `v0.4k_bwr_19` (neměnit).

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
| I B/W stripes | 030 | **OVĚŘENO vizuálně** — vlastní B/W pruhy na panelu |
| J B/W/R cal | 031 | diagonály + kalná červená (stride 37) |
| K B/W/R 19 B/row | 032 | **OVĚŘENO** BLACK\|WHITE\|RED + marker |
| L OpenVusionHack | 033 | **OVĚŘENO vizuálně** — OpenVusion černě, Hack červeně |
