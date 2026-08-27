# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
9ed65cf EXP-006; EXP-007 in progress
```

## Current firmware variant

```text
v0.3a_uart_baseline  (UART only, no P2_0/P0_0)
26 MHz XOSC, heartbeat dots, RESET_CAUSE print
```

## Current hardware state

```text
TAG: ON (GPIO17 lo)
Debugger: CONNECTED and working (cc-tool sees CC2510 0x2510)
UART: available
```

## Last experiment

```text
EXP-20260827-007 flash v0.3a
verify OK, one banner RESET_CAUSE=1 EXTERNAL_RESET_N, 17 idle dots, no reset loop
```

## Verified findings

- Debugger funguje: USB 0451:16a2, program + verify.
- v0.3a s debuggerem je stabilní.
- Bez debuggeru relé řeže napájení; v0.3e bez debuggeru stormovalo na P2_0=1.

## Open hypotheses

- True POR v0.3a (bez P2_0) bude stabilní, nebo se POR smyčka vrátí i bez EPD GPIO.
- P2_0 high bez debugger hold-up = brownout.

## Next recommended experiment

1. Odpojit CC Debugger (CP2102 RXD+GND nechat).
2. True POR v0.3a přes relé, 20–30 s UART.
3. Čekat: právě jeden banner, `RESET_CAUSE=0 POR/BROWNOUT`, kontinuální tečky.

## Human action required?

```text
OPTIONAL: odpojit CC Debugger od tagu, napsat „debugger odpojen“.
Pak umím ověřit true POR na v0.3a (bez P2_0).
```
