# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
49ddbcf EXP-010; EXP-011 PASS this session
```

## Current firmware variant

```text
NEW DEV: v0.3a_uart_baseline — UART heartbeat běží
```

## Current hardware state

```text
GPIO17 dh  tag 3V OFF
GPIO27 dh  debug isolated (idle after EXP-013b)
USB CC Debugger: present (replugged, red LED)
cc-tool: Programmer OK, No target detected
```

## Polarita GPIO27 — oprava

Předchozí odhad NC / active-high byl špatně.

Lidské pozorování při `pinctrl` GPIO27 **LOW**: 3 LED svítí, kontakty spojené. To je NO + active-low, přesně jak skripty čekají.

Starší continuity „LOW = neprochází“ nesedí s LED/kontakty. Brát vizuál + NO.

EXP-012 Phase B (GPIO27 LOW) tedy debug **spojoval** a `cc-tool` stejně neviděl CC2510. Polarita to nebyla.

## Human action required?

```text
YES — 3 V na DVDD tagu při GPIO17 ON, nebo DD (dbg pin 4) / DC (pin 3) / RESET (pin 7).
```

## Last experiment

```text
EXP-013b: USB stayed; Programmer OK; No target detected
```

## Verified findings

- USB 5V vyhybka zrušena: GPIO27 dh neschová 0451:16a2
- Debug bus k CC2510 přes GPIO27 relé zatím nevede
- GPIO17 off MCU nevypne (parazit / baterie — HYPOTÉZA)

## Open hypotheses

- RESET/DD/DC nejsou v sérii na tagu, nebo kabel není na tagu
- MCU žije z DVDD sense do živého debuggeru, nebo z baterie

## Next recommended experiment

Až člověk potvrdí, že 3 relé cvakají a kabel je na tagu: znovu `cc-tool -t` s GPIO17 dl + GPIO27 dl. Neflashovat do té doby.

## Human confirmation 2026-08-27 23:37

```text
Debug kabel na tagu, RESET/DD/DC přes 3 relé — ANO (člověk ještě proměří)
3 relé cvakla při GPIO27 LOW — ANO
GND + DVDD sense trvale — ANO
Baterie v tagu — NE; napájení jen GPIO17
```

Důsledek: heartbeat při GPIO17 off není z baterie. Zbývá parazit přes DVDD sense do živého debuggeru (HYPOTÉZA). Polarita GPIO27 = NO + active-low, stejná jako skripty.
