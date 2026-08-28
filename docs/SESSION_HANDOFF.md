# Session Handoff

## Current firmware

```text
v0.4e_cmd00 — EXP-026 na DEV tagu, TAG OFF (idle)
```

Build: `--nooverlay` pro v0.4c / v0.4d / v0.4e.

## EPD ladder

- EXP-024 H-L-H: P1_3 0→1
- EXP-025 SPI idle: P0SEL=28, P0_2 čistý
- EXP-026 `0x00`/`0x0E`: TX OK, BUSY zůstal 1
- Další: ne `0x12`; vyhodnotit před min init (EXP-F)

UART CP2102 nechat v USB (RXD+GND).
