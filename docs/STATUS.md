# STATUS — GU140 NFC foundation

**Mission:** OpenVusionHack-native NFC (RPi TWN4 → NTAG I²C Plus → CC2510 → EPD)  
**Branch:** `research/nfc-gu140`  
**Target:** DEV tag only.

## Now

OVMB v1 + EPD **OVĚŘENO** EXP-066/067/068. MCU `v0.12b_nfc_epd`. Config mirror beze změny.

```text
python3 tools/nfc_gateway/cli.py send /path/to/11248.bin
```

Exit 0 jen po DONE. GPIO20 jednou na `send` (nebo `--no-twn4-gpio`, pokud relé drží vnější skript). RF ON/OFF přes TWN4 API.

## NFC ladder

| Step | EXP | Result |
|---|---|---|
| SRAM_MIRROR 16 B / 64 B | 063/065 | **PASS** |
| OVMB protocol 11248 B | 066 | **PASS** (no EPD) |
| CoG stays init during chunks | 067 | **PASS** |
| CoG stream + 0x12 | 068 | **PASS** UART BUSY 0→1, sklo rastr A |
| Known artwork via NFC | 069 | **PASS** ovhack na skle (fotka) |

Milestone: `milestone/nfc-image-transfer`.
