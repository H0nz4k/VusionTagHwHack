# Session Handoff

## Current firmware

```text
v0.4j_bwr_cal — EXP-031 na DEV tagu, TAG OFF (idle)
```

Známý B/W obraz: `v0.4i_stripes` (nezměněn).

Build: `--nooverlay` pro v0.4c … v0.4j.

## EPD

First refresh **OVĚŘENO** (EXP-030 fotka). EXP-031 nahrál B/W/R kalibraci a doběhl stejný BUSY cyklus.

Hypotéza (EXP-030 B/W + oficiální 2.66" demo, 0× bit `(1,1)`):

```text
WHITE = plane10 0, plane13 0
BLACK = plane10 1, plane13 0
RED   = plane10 0, plane13 1
```

Layout: BLACK | WHITE | RED plus černý marker v prvních 16 řádcích.

UART CP2102 nechat v USB (RXD+GND).

**Lidská otázka:** Která třetina panelu je červená, která černá, která bílá? Je vidět černý roh/marker v bílé?
