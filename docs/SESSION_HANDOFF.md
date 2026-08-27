# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
b2a6dbb firmware+EXP-001..005; EXP-006 docs committing now
```

## Current firmware variant

```text
v0.3e_reset_probe  (STILL IN FLASH — unsafe to leave powered without debugger)
Do not TAG ON until a UART-only image is flashed.
```

## Current hardware state

```text
TAG: OFF (GPIO17 hi) — fail-safe, debugger disconnected
Debugger: DISCONNECTED (cc-tool: device not found)
UART: available (CP2102 RXD+GND)
```

Bez debuggeru relé **opravdu vypíná/zapíná**. TAG ON se v0.3e spustí ~57 Hz reset storm — nenechávat zapnuté.

## Last experiment

```text
EXP-20260827-006 true POR without debugger
Relay cut: PASS (TAG OFF = no heartbeat)
v0.3e POR: FAIL — 1714x START in 30s, dies at P2_0=1 / OFF/RST0
```

## Verified findings

- Bez debuggeru GPIO17 hi = skutečný power cut.
- Bez debuggeru GPIO17 lo = skutečný POR.
- v0.3e s debuggerem doběhlo k DONE; bez debuggeru padá hned po `EPD_RESET=1`.
- Clock/UART 26 MHz na true POR stihne vytisknout banner — XOSC+UART fungují.

## Open hypotheses

- P2_0 high bez debugger hold-up = brownout (proudový spike). RESET_CAUSE zatím neověřen (v0.3e ho netiskne).
- P0_0 polarita může být opačná, takže „OFF“ panel neodpojí.
- P1_3 není potvrzený BUSY.

## Next recommended experiment (odpoledne)

1. Připojit CC Debugger (pin 9 3V3 pořád nepřipojovat).
2. TAG ON.
3. Flash **UART-only** (v0.3a nebo ještě lepší: žádný drive P2_0/P0_0).
4. Ověřit verify.
5. Odpojit debugger.
6. True POR v0.3a: čekat jeden banner + tečky, `RESET_CAUSE`.
7. Teprve potom izolovat P2_0 samotné.

## Human action required?

```text
PAUSE until afternoon.
Before next flash: reconnect CC Debugger to the DEV tag.
Do not power the tag in the meantime (leave relay OFF).
```
