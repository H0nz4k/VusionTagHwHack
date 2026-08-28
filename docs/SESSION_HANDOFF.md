# Session Handoff

## Current firmware

```text
v0.6e_nfc_sess2 — last flash (EXP-044). ACKAA=01 ACKFE=01 ACKAB=00
v0.6b_nfc_ack0 — last NFC-A PASS (EXP-040 ACK0=01)
v0.5c_rf_rxrssi — last UART-PASS RF image
```

TAG OFF, debug isolated.

Known-good EPD (do not modify): `v0.4k_bwr_19`, `v0.4l_ovhack`.

## NFC

TWN4: `/dev/ttyACM0` (never `/dev/ttyUSB0`). `hw` is in `dialout`.

```text
PYTHONPATH=tools/ElaTool/src python3 tools/nfc_gateway/cli.py --port /dev/ttyACM0 reader-info
PYTHONPATH=tools/ElaTool/src python3 tools/nfc_gateway/cli.py --port /dev/ttyACM0 --wait 8 probe
```

MCU I2C **OVĚŘENO**: P0_4 SDA, P0_6 SCL, 8-bit addr 0xAA ACK. P1_0 not needed for ACK.

Session read **not** working: 0xAB NACK after both repeated-start and STOP+START. Do not PTHRU/SRAM until ACKAB=1.

## UART capture

Isolated flash (`cc-tool` then immediate `cat`) often high-bit garbage. Recapture after settle (`scripts/pi/ov26-uart-recap.sh`) is reliable at 115200. Baud sweep EXP-042.

## Next exact step

New analysis for I2C **read** (not a third identical 0xAB attempt): slower SCL, Sr with SCL held low then SDA rise/fall, or TWN4 physically away so RF cannot lock I2C. Then NFC-C FD only after session bytes look like NT3H2111 (not FF×8).

Do not tag `milestone/nfc-mailbox` yet. I2C ACK proof is EXP-040.

Milestones unchanged: display-* + uart-stable + epd-first-refresh.
