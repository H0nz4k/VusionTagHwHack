# Session Handoff

## Current firmware

```text
v0.12b EXP-068: OVMB + CoG 0x10/0x13 + 0x12 PASS.
BUSY wait 100 samples; ready = P1_3 HIGH.
Config E8=1B 00 10 48 still.
```

```text
python3 /home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py send /tmp/ovmb_a.bin
```

TWN4 `/dev/ttyACM0`. GPIO20 on once per `send`. MCU I2C only after `set_rf_off`.

Lidská fotka skla po posledním image A (`6645BA54`) ještě chybí.
