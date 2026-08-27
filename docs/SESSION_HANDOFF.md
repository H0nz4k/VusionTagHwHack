# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
71b8379 exp: debug path to tag still yields no cc-tool target
```

## Current firmware variant

```text
NEW DEV: v0.3a_uart_baseline
```

## Current hardware state

```text
GPIO17 dh  tag OFF
GPIO27 dh  debug isolated
GPIO21 dh  debugger USB 5V OFF
EXP-014 PASS: attach → CC2510
```

## Verified findings

- GPIO21 řeže USB +5 V debuggeru (~1 s on/off)
- `attach` (tag + RESET/DD/DC, pak USB 5V) → cc-tool vidí CC2510 bez ručního replugu
- GPIO27 = debug linky, NO active-low
- GPIO17 = tag 3 V

## Open hypotheses

- Power-on RESET_CAUSE=EXTERNAL_RESET_N bez debuggeru: RC na RESET_N

## Next recommended experiment

EPD passive na novém DEV: runtime s GPIO27+21 off.

## Human action required?

```text
NO
```
