# Session Handoff

## Current firmware

```text
v0.4c_reset_hlh — EXP-024 na DEV tagu, TAG OFF (idle)
```

Build: `build_one.sh` přidává `--nooverlay` jen pro `v0.4c_reset_hlh` (bez toho UART garbage).

## EPD ladder

- EXP-022 BUSY passive: P1_3=0
- EXP-023 PWR only: P0_0 drive OK, BUSY stále 0
- EXP-024 P2_0 H-L-H po PWR ON: MCU žije, P1_3 0→1 po RST H2, drží 1
- **Další není SPI** — vyhodnotit EXP-024, pak EXP-D idle clock

UART CP2102 nechat v USB (RXD+GND).
