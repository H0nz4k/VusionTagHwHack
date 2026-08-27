# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
dd41bb4 exp: flash v0.3a via GPIO21 attach, isolated UART PASS
```

## Current firmware variant

```text
NEW DEV: v0.3f_led_p2 — P2_1/P2_2 cycle, UART stable
```

## Current hardware state

```text
GPIO17 dl  TAG ON (left on so human can watch LEDs)
GPIO27 dh  debug isolated
GPIO21 dh  USB debugger off
```

## Last experiment

```text
EXP-016 UART PASS; LED colors need human
```

## Next recommended experiment

Map LED colors to P2_1/P2_2 states from human report.

## Human action required?

```text
YES — popsat barvu LED pro stavy 00 / 10 / 01 / 11 (~2 s, dokola).
```
