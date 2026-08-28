# Session Handoff

## Current firmware

```text
v0.4i_stripes — EXP-030 na DEV tagu, TAG OFF (idle)
```

Build: `--nooverlay` pro v0.4c … v0.4i. Extra helpers / `delay_hold()` = UART garbage od bytu 0; flatten jako v0.4g.

## EPD ladder — first refresh OVĚŘENO

- EXP-024 H-L-H: P1_3 0→1
- EXP-025 SPI idle: P0SEL=28, P0_2 čistý
- EXP-026 `0x00`/`0x0E`: TX OK, BUSY zůstal 1
- EXP-027 min init `register_data_sm`: TX OK
- EXP-028 5624+5624: TX OK
- EXP-029 `0x04`+`0x12`: BUSY 1→0→1 ~15 s
- EXP-030 pruhy: stejný BUSY cyklus
- **Lidská fotka:** celý panel vlastní B/W pruhy (`captures/ov26_exp030_visual.png`)

UART CP2102 nechat v USB (RXD+GND).

## Další směr

Červená rovina / BWR pattern, nebo LED continuity (fyzické měření). First-refresh GPIO sada jako celek řídí E2266JS0C2.
