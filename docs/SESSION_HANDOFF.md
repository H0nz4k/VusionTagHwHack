# Session Handoff

## Current firmware

```text
v0.4h_refresh — EXP-029 na DEV tagu, TAG OFF (idle)
```

Build: `--nooverlay` pro v0.4c … v0.4h. Extra helpers / `delay_hold()` = UART garbage od bytu 0; flatten jako v0.4g.

## EPD ladder

- EXP-024 H-L-H: P1_3 0→1
- EXP-025 SPI idle: P0SEL=28, P0_2 čistý
- EXP-026 `0x00`/`0x0E`: TX OK, BUSY zůstal 1
- EXP-027 min init `register_data_sm`: TX OK
- EXP-028 5624+5624 white/FF+00: TX OK
- EXP-029 `0x04`/`0x00` + `0x12`/`0x00`: **BUSY 1→0→1 ~15 s** po 0x12
- Další: EXP-030 pruhy; člověk zkontroluje panel (e-paper drží bez napájení)

UART CP2102 nechat v USB (RXD+GND).

**Lidská otázka:** Je na DEV tagu po EXP-029 vidět změna e-paperu (vyčištění / plná plocha / cokoliv jiného než starý obraz)?
