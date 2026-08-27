# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
270eb27 EXP-007 v0.3a; relay NO polarity documenting now
```

## Current firmware variant

```text
v0.3a_uart_baseline  (UART only, no P2_0/P0_0)
```

## Current hardware state

```text
TAG: OFF (GPIO17 dh, NO open)
Debugger 5V relay: OFF (GPIO27 dh, NO open)
Debugger USB: expected absent while GPIO27 dh
UART CP2102: independent, should stay up
```

## Last experiment

```text
Relay sequence 17 ON → 27 ON → 17 OFF → 27 OFF: PASS (human heard correct clicks)
Contacts: NO — unenergized = open = power disconnected
```

## Verified findings

- GPIO17/GPIO27 active-low coil, NO contacts.
- dl = power on, dh = power off. Idle both dh is fail-safe.
- v0.3a is in flash. True POR without human unplug is now possible: GPIO27 dh first, then GPIO17 cycle.

## Open hypotheses

- True POR v0.3a (no P2_0) stable vs POR loop without debugger hold-up.

## Next recommended experiment

1. GPIO27 dh (debugger 5V off).
2. GPIO17 dh 2s, UART arm, GPIO17 dl (true POR).
3. 20 s capture: one RESET CAUSE banner + dots, no storm.

## Human action required?

```text
NO
```
