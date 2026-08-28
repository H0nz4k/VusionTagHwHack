# Session Handoff

## Current firmware

```text
v0.7a_nfc_fd_led — FD+LED demo on DEV (EXP-045). Debugger isolated at runtime.
```

TAG OFF, debug isolated.

Known-good EPD (do not modify): `v0.4k_bwr_19`, `v0.4l_ovhack`.

## NFC

TWN4: `/dev/ttyACM0` (never `/dev/ttyUSB0`). `hw` is in `dialout`.

```text
PYTHONPATH=tools/ElaTool/src python3 tools/nfc_gateway/cli.py --port /dev/ttyACM0 reader-info
PYTHONPATH=tools/ElaTool/src python3 tools/nfc_gateway/cli.py --port /dev/ttyACM0 field-watch --wait 60
```

MCU I2C **OVĚŘENO**: P0_4 SDA, P0_6 SCL, 8-bit addr 0xAA ACK. P1_0 not needed for ACK.

P1_1 FD idle HIGH without RF **OVĚŘENO** (EXP-045). LED pair P2_1+P2_2 off without field. Proximity blink needs TWN4 antenna on the tag (`in_field` was 0 at bench rest pose).

Session read **not** working: 0xAB NACK after both repeated-start and STOP+START. Do not PTHRU/SRAM until ACKAB=1.

## UART capture

Isolated flash (`cc-tool` then immediate `cat`) often high-bit garbage. Recapture after settle (`scripts/pi/ov26-uart-recap.sh`) is reliable at 115200. Baud sweep EXP-042.

## Next exact step

Human: TAG ON, debug OFF, `field-watch --wait 60`, přiložit TWN4 na anténu ESL. Čekat `in_field true` a blikání (RGB+bílá). Když UID je a LED tma → invertovat FD polaritu.

I2C read 0xAB NACK je oddělený problém (ne poloha čtečky).

Do not tag `milestone/nfc-mailbox` yet.
