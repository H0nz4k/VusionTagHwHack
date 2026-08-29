# Session Handoff

## Current firmware

```text
v0.11i EXP-065: SRAM mailbox 64 B OVĚŘENO (F8–FB = 00…3F).
Config E8=1B 00 10 48 persists (SRAM_MIRROR_BLOCK I2C 0x10 = NFC 0x40).
Next: protocol frames in the 64 B window, then CoG stream + 0x12 after CRC.
```

Do not reflash SHOW unless you need glass menu. Do not touch REG_LOCK / AUTH / PWD.

MCU must leave I²C idle while TWN4 writes. Recap UART only after `twn4-off`.

## Mailbox (physical path done)

```text
# raw 64 B test (not the image protocol)
ssh vusion-rpi 'bash /home/hw/bin/ov26-exp065.sh'   # flashes v0.11i
python3 tools/nfc_gateway/cli.py mbox-mirror --phase payload64 --wait 16
```

TWN4 `/dev/ttyACM0` only. Relays: tag 3 V then `twn4-on`. Protocol: `docs/NFC_MAILBOX_PROTOCOL.md` (layout still HYPOTÉZA).

## Show

```text
/home/hw/bin/ov26-nfc-show.sh 2
```

NFC `0x40`–`0x4F` is SRAM while VCC+mirror, not user EEPROM. SHOW command stays on `0x30`.
