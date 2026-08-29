# STATUS — GU140 NFC foundation

**Mission:** OpenVusionHack-native NFC (RPi TWN4 → NTAG I²C Plus → CC2510 → EPD)  
**Branch:** `research/nfc-gu140`  
**Target:** DEV tag only.

## Now

Mailbox + EPD **OVĚŘENO**. Uživatelské příkazy: `tag-flash-latest`, `tag-send-image`. Release `v0.12b_nfc_epd` v `firmware/releases/latest.json`.

```text
tag-flash-latest --confirm-dev-tag --yes
tag-send-image captures/nfc/art/ovhack.bin
```

Návod: [`FLASH_AND_IMAGE.md`](FLASH_AND_IMAGE.md).

## NFC ladder

| Step | EXP | Result |
|---|---|---|
| SRAM_MIRROR 16 B / 64 B | 063/065 | **PASS** |
| OVMB protocol 11248 B | 066 | **PASS** (no EPD) |
| CoG stays init during chunks | 067 | **PASS** |
| CoG stream + 0x12 | 068 | **PASS** UART BUSY 0→1, sklo rastr A |
| Known artwork via NFC | 069 | **PASS** ovhack na skle (fotka) |
| User flash/send utils | 070 | **PASS** |

Milestone: `milestone/nfc-image-transfer`.
