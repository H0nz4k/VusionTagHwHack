# Session Handoff

## Current firmware

```text
v0.3k_led_regdump — na DEV tagu, TAG OFF
GPIO17/27/21 = dh (idle)
```

## LED (čeká člověk)

Kontinuita **za** třemi katodovými rezistory RGB: společný sink, nebo tři FET?
Viz `docs/LED_GL340_TRACE.md`.

## Po LED měření — EXP-A…H k first refresh

P2_0 = EPD_RESET **REFERENCE**. Historický storm = korelace, kauzalita **UNKNOWN**.
First-refresh GPIO: P0_0, P0_1, P0_3, P0_5, P1_2, P1_3, P2_0. **P0_2 nedriveovat.**
Po každém stupni commit + EXP log. `docs/EPD_REFERENCE.md`.
