# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
18316a6 EXP-009 UART OK; EXP-010 true POR storm
```

## Current firmware variant

```text
NEW DEV: v0.3a_uart_baseline (unlocked, verify OK, UART OK with debugger 5V on)
```

## Current hardware state

```text
TAG: OFF (GPIO17 dh)
DBG 5V: OFF (GPIO27 dh)
debugger USB: absent
Do not TAG ON until debug cable is off the tag — v0.3a storms on RESET_N
```

## Last experiment

```text
EXP-010 true POR, debugger 5V off: 708x EXTERNAL_RESET_N in 20s (~28 ms/boot)
Power cut itself works (tag off = no heartbeat).
```

## Verified findings

- GPIO17 really cuts tag power (no battery keep-alive).
- True POR with debug *cable still attached* but USB 5V off is a RESET_N storm, not POR/BROWNOUT.
- With debugger USB powered, v0.3a heartbeats (EXP-009).

## Open hypotheses

- Unpowered CC Debugger still wired to RESET_N is pulling/glitching reset.

## Next recommended experiment

Human: disconnect debugger from tag (keep CP2102). Then GPIO17-only POR of v0.3a.

## Human action required?

```text
YES: unplug CC Debugger wires from the tag (RESET/DD/DC/DVDD/GND).
Leave CP2102 RXD+GND. Then say „debugger odpojen od tagu“.
```
