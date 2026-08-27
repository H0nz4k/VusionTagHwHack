# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
49ddbcf EXP-010; EXP-011 PASS this session
```

## Current firmware variant

```text
NEW DEV: v0.3a_uart_baseline — stable true POR without debug cable
```

## Current hardware state

```text
TAG: OFF (GPIO17 dh)
DBG 5V: OFF (GPIO27 dh)
Debug cable: disconnected from tag (human)
UART: CP2102 on P1_6
```

## Last experiment

```text
EXP-011: 1x banner EXTERNAL_RESET_N, 19 dots, no loop
```

## Verified findings

- v0.3a one-boot + heartbeat without debugger: OVĚŘENO
- EXP-010 storm was RESET_N via attached unpowered/powered debug cable

## Open hypotheses

- Power-on reports EXTERNAL_RESET_N due to board RESET_N RC, not POR. Harmless.

## Next recommended experiment

EPD passive GPIO (v0.3c) with debugger disconnected for runtime; connect debugger only to flash.

## Human action required?

```text
NO
```
