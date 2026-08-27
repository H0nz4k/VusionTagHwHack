# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
00c407e exp: GPIO21 USB 5V attach sequence sees CC2510
```

## Current firmware variant

```text
NEW DEV: v0.3a_uart_baseline (just re-flashed, verify OK)
```

## Current hardware state

```text
GPIO17/27/21 idle (dh)
UART POR after flash: 1 banner + 14 dots PASS
```

## Verified findings

- attach + flash + isolated POR: OVĚŘENO EXP-015

## Open hypotheses

- Power-on RESET_CAUSE=EXTERNAL_RESET_N: RC na RESET_N

## Next recommended experiment

EPD passive v0.3c, runtime GPIO27+21 off.

## Human action required?

```text
NO
```
