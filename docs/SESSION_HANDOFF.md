# Session Handoff

## Current firmware

```text
v0.12b EXP-069: last NFC image on glass is OpenVusionHack (D9331F86).
Config E8=1B 00 10 48 still.
```

```text
python3 /home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py send /tmp/ovhack.bin
```

TWN4 `/dev/ttyACM0`. GPIO20 on once per `send`. MCU I2C only after `set_rf_off`.

Fotka: `captures/ov26_exp069_visual.png` — OpenVusion černě, Hack červeně. Shoda s EXP-033.
