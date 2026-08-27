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
TAG 3V relay: OFF (GPIO17 dh) — MCU ALE běží (heartbeat)
DBG lines GPIO27: dh (intended isolate)
USB CC Debugger: present (no longer switched)
UART: CP2102 on P1_6, dots at ~1 Hz even with GPIO17 off
cc-tool: programmer OK, no target either GPIO27 polarity
```

## Last experiment

```text
EXP-012: USB-always-on PASS; cc-tool target FAIL both polarities
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

## Human action required?

```text
YES — zkontrolovat zapojení RESET_N / DD / DC přes relé na tag.
MCU teď nejde vypnout GPIO17; chceš-li ticho, odpoj USB debugger nebo DVDD sense.
```
