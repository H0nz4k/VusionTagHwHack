# Session Handoff

## Current firmware

```text
v0.4k_bwr_19 — EXP-032 na DEV tagu, TAG OFF (idle)
```

`v0.4i_stripes` a `v0.4j_bwr_cal` zachovány.

## EPD

EXP-031 vizuál: náznak červené, **ne** sytá; diagonální stupňovité pruhy. Příčina: 37 B/řádek místo native **19 B** (Pervasive 2.66" H=152).

EXP-032: stejné kódování, 19 B/row, tři pásy + marker. UART PASS, stejn ý BUSY cyklus.

```text
WHITE = plane10 0, plane13 0
BLACK = plane10 1, plane13 0
RED   = plane10 0, plane13 1
```

**Lidská otázka:** Jsou na panelu tři souvislé oblasti (ne diagonály)? Je červená sytá jako stock? Je vidět černý marker?
