# Session Handoff

## Current firmware

```text
v0.4d_spi_idle — EXP-025 na DEV tagu, TAG OFF (idle)
```

Build: `--nooverlay` pro `v0.4c_reset_hlh` a `v0.4d_spi_idle`.

## EPD ladder

- EXP-022 BUSY passive: P1_3=0
- EXP-023 PWR only: P0_0 drive OK, BUSY stále 0
- EXP-024 P2_0 H-L-H: MCU žije, P1_3 0→1
- EXP-025 SPI idle: P0SEL=28, P0_2 čistý, CS=1, žádný byte
- Další: EXP-026 první command `0x00` + `0x0E`

UART CP2102 nechat v USB (RXD+GND).
