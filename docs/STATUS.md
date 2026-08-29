# STATUS — GU140 NFC foundation

**Mission:** OpenVusionHack-native NFC (RPi TWN4 → NTAG I²C Plus → CC2510 → EPD)  
**Branch:** `research/nfc-gu140`  
**Target:** DEV tag only.

## Now

OVMB v1 protokol **OVĚŘENO** EXP-066: tři celé 11 248 B přenosy + fault testy. MCU `v0.12a`. Config mirror beze změny. Další: stream do CoG a `0x12`.

```text
python3 tools/nfc_gateway/cli.py send /path/to/11248.bin
```

## NFC ladder

| Step | EXP | Result |
|---|---|---|
| SRAM_MIRROR 16 B / 64 B | 063/065 | **PASS** |
| OVMB protocol 11248 B | 066 | **PASS** (no EPD) |
| CoG stream + 0x12 | — | next |
