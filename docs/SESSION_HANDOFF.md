# Session Handoff

## Current firmware

```text
v0.12a EXP-066: OVMB protocol PASS (11248 B x3, faults rejected). No EPD 0x12.
Config E8=1B 00 10 48 still. Next: v0.12b CoG stream + refresh.
```

```text
python3 /home/hw/OpenVusion26_FW/tools/nfc_gateway/cli.py send /tmp/ovmb_a.bin
```

TWN4 `/dev/ttyACM0`. GPIO20 on once. MCU I2C only after `set_rf_off`.
