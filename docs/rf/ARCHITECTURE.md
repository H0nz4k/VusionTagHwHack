# RF architecture

## North star (tonight = PHY + framing only)

```text
application
    │
Raspberry Pi gateway (Python)
    │  SPI  (CC2500 — hardware tonight ABSENT)
    ▼
2.4 GHz  OVH_RF_PROFILE_0
    ▼
GU140 CC2510  (RFD / RFST, not SPI FIFO)
    │
UART proof  (later: SHOW_DEMO → existing EPD path)
```

Home Assistant / MQTT / AES / OTA firmware: mimo scope.

Originální Vusion pairing/crypto/pakety: **nezabývat se** na této větvi.

## Proč CC2510 ≠ CC2500 driver

| | CC2500 module | CC2510 SoC |
|---|---|---|
| Host | SPI, 64 B TX/RX FIFO | `RFD` one-byte register |
| Byte ready | GDO / FIFO status | `TCON.RFTXRXIF` |
| Strobes | SPI `0x30+` | `RFST` `0x00–0x04` |
| Config regs | SPI addr `0x00–0x2E` | XDATA `0xDF00–0xDF2E` (stejná jména) |

PHY (GFSK, FREQ, MDMCFG) je příbuzný. Host interface **není** kopírovatelný.

TI (DN107, SWRS055 §13.3): pro vyšší bitrate DMA na `RFD`. První packety: polling/`RFTXRXIF`, malý payload.

## Gateway fázování

```text
A  Pi + 1× CC2500     — preferred, čeká na hardware
B  2× CC2500          — referenční link před GU140
C  CC2500 ↔ GU140     — first packet
D  optional CC2511 USB dongle (budoucnost, ne PCB tonight)
```

Plánovaný modul: MikroElektronika ccRF Click (MIKROE-1435, CC2500, 3.3 V SPI). **Není** na lab Pi (2026-08-28): žádný `spidev`, žádný extra USB radio.

## Tag firmware

Nové cíle `v0.5*` vedle EPD `v0.4k` / `v0.4l`. EPD kód se **nekopíruje ani nerefaktoruje**.

`SHOW_DEMO` později zavolá existující známý-good refresh; tonight se nespouští.

## Identita tagu

CC2510 **nemá** ověřené unikátní silicon serial pro aplikaci. v0.1:

```text
OVH_TAG_ID = 0x00000001   # compiled DEV bench ID
```

Budoucí zdroje (HYPOTÉZA): externí flash záznam, NFC UID, přiřazené OpenVusionHack ID.

## Paměť

Full BWR = 11248 B. Do IRAM/XRAM se nevejde. Image transfer = chunky + staging (viz IMAGE_TRANSFER.md). RF packety v0.1: ≤24 B payload.

SDCC: `--nooverlay` (UART garbage od v0.4c+).
