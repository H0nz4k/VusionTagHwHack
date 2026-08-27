# Session Handoff

Agent tento soubor aktualizuje po větším bloku práce nebo před ukončením session.

## Last known good commit

```text
bb02cf5 relay GPIO hold/guard
```

## Current firmware variant

```text
Unknown on the NEXT tag.
Previous DEV last flashed: v0.3a_uart_baseline
Previous DEV may be damaged (debugger LED dies when connected) — HYPOTÉZA short/DVDD collapse
```

## Current hardware state

```text
TAG relay GPIO17: dh (coil off, NO open)
DBG relay GPIO27: dh (coil off, NO open)
Relay hold/guard systemd: enabled on Pi
UART / debugger USB: last seen unplugged from Pi
```

## Last experiment

```text
Could not UART-test previous tag: CP2102 and CC Debugger were not on USB,
relay contact outputs were disconnected.
```

## Verified findings

- GPIO17/27 NO, active-low: dh=off, dl=on.
- Dual coils ON can collapse Pi 5V → GPIO float → relay chatter.
- Guard/idle services keep pins as outputs HIGH.

## Open hypotheses

- Previous DEV tag debug/DVDD path shorted (programmer LED off on connect).
- Next physical tag identity unknown (DEV vs stock).

## Next recommended experiment

WAIT for human: new tag wired.
Then ONLY: relays idle, debugger+tag power one coil at a time, `cc-tool -t`, UART observe.
**NO erase/write/flash/lock** unless the human explicitly says this unit is the sacrificial DEV.

## Human action required?

```text
YES: wire the new tag. State whether it is a new sacrificial DEV
(original FW already gone / allowed to flash) or a stock/golden tag
(flash FORBIDDEN without a second explicit YES).
```
