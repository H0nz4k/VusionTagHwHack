# Session Handoff

## Current firmware

```text
v0.4l_ovhack — EXP-033 OpenVusionHack na DEV tagu, TAG OFF (idle)
```

Known-good BWR baseline (neměnit): `v0.4k_bwr_19`.

## Encoding (OVĚŘENO EXP-032)

```text
WHITE = plane10 0, plane13 0
BLACK = plane10 1, plane13 0
RED   = plane10 0, plane13 1
native row = 19 bytes (152 px), 296 rows, 5624 B/plane
```

Milníky: `milestone/epd-first-refresh`, `milestone/display-test-pattern`, `milestone/display-bwr`, `milestone/display-first-content`.

EXP-033: **OVĚŘENO vizuálně** — OpenVusion černě, Hack červeně, pozadí bílé. Fotka `captures/ov26_exp033_visual.png`.
