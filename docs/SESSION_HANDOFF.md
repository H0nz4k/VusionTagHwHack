# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
b99fbdf before EXP-008; EXP-008 flashing this session
```

## Current firmware variant

```text
NEW DEV tag: v0.3a_uart_baseline (erase unlocked + verify OK)
Previous physical DEV: suspected damaged, do not reconnect
```

## Current hardware state

```text
TAG: ON (GPIO17 dl)
DBG 5V: ON (GPIO27 dl)
cc-tool: CC2510 0x2510 UNLOCKED
UART capture after flash: no banner (P1_6 path unproven on this unit)
```

## Last experiment

```text
EXP-008: mass-erase locked stock + v0.3a verify PASS; UART silent
```

## Verified findings

- New unit was locked stock; human authorized sacrifice.
- Erase+write+verify v0.3a succeeded; lock bit gone.
- Debug interface works on the new tag.

## Open hypotheses

- CP2102 not on this tag's P1_6 yet.
- Old tag shorted.

## Next recommended experiment

Confirm P1_6 wiring, then UART capture around cc-tool --reset. No extra flash unless wiring confirmed.

## Human action required?

```text
OPTIONAL: confirm CP2102 RXD is on the NEW tag pin 33 / P1_6, GND common.
```
