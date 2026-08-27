# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
b2a6dbb on research/gu140-autonomous
```

## Current firmware variant

```text
v0.3e_reset_probe  (last flashed, sitting in while(1) after DONE / safe shutdown)
26 MHz XOSC, USART1 Alt2 115200 P1_6
```

## Current hardware state

```text
TAG: ON (GPIO17 lo) — KEEP ON while debugger is connected
Debugger: connected
UART: available (CP2102 by-id ..._0001-if00-port0)
```

TAG OFF při připojeném debuggeru MCU **nevypne** (parazitní napájení). Preferuj TAG ON, dokud je debugger na tagu.

## Last experiment

```text
EXP-20260827-005 v0.3e reset probe
MCU: PASS (one banner, DONE, 15s silent idle)
BUSY identity: INCONCLUSIVE (P1_3 follows P2_0 even with P0_0 in OFF state)
```

## Verified findings

- SSH / SDCC 4.2.0 / cc-tool / pinctrl / UART adapter fungují.
- `cc-tool -t` → CC2510 ID `0x2510`. Flash: erase + write `.hex` + verify method `read`. Target musí být napájen.
- GPIO17 relé při připojeném CC Debuggeru neudělá hard POR; UART tečky pokračují při TAG OFF.
- `cc-tool --reset` → `RESET_CAUSE=1 EXTERNAL_RESET_N` (v0.3a).
- 26 MHz XOSC idle heartbeat je stabilní (~1 Hz tečky), žádný spontánní POR.
- 13 MHz HS-RCOSC idle heartbeat je stabilní (~2.1 s/tečka), žádný spontánní POR; streamovaný UART text je mimo krystalovou přesnost.
- v0.3c: P1_3 boot 1→0, dál 0, jeden banner.
- v0.3d: P0_0 OFF→BUSY=1, ON→BUSY=0, sekvence DONE, žádný reset loop.
- v0.3e: P2_0 0→1 při P0_0 OFF mění P1_3 1→0; po H/L/H BUSY zůstane 0; MCU stable.

## Open hypotheses

- Původní opakovaný `POR/BROWNOUT` vyžaduje true power-on **bez** debuggeru.
- P0_0 = EPD power (active-low) — konzistentní, nepotvrzené.
- P1_3 = EPD BUSY — **oslabené**, protože sleduje P2_0 i ve stavu „power off“.
- P2_0 = EPD RESET — ovlivňuje P1_3; identita pořád HYPOTÉZA.
- Parazitní napájení teče přes DD/DC/RESET_N / voltage-sense, ne přes debugger pin 9.

## Next recommended experiment

1. Izolovat vazbu P2_0 ↔ P1_3: togglovat **jen** P2_0, P0_0 nechat input/Hi-Z, logovat P1_3.
2. Až potom znovu zvážit polaritu P0_0 (možná „OFF“ panel neodpojí).
3. Teprve poté harmless EPD command. **Žádný CoG refresh.**
4. Volitelně: člověk odpojí CC Debugger a udělá TAG OFF/ON pro true POR test v0.3a.

## Human action required?

```text
NO (blocker)
OPTIONAL: odpojit CC Debugger od tagu (ponechat CP2102 RXD+GND),
potom napsat „debugger odpojen“. To umožní ověřit skutečný POR/BROWNOUT
bez parazitního napájení. Já to fyzicky udělat neumím.
```
