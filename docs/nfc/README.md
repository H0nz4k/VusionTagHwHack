# NFC na GU140

Stock Vusion Active NFC **neimplementujeme**. Vlastní cesta: TWN4 nebo telefon → NTAG I²C Plus 1K → CC2510 I²C → EPD.

Kód a HIL experimenty EXP-038…071 žijí v sourozeneckém checkoutu `tools/Debugger/OpenVusion_GU140_Cursor_Agent_Project` (větev `feature/tagset`). Zde je souhrn, který v `research/gu140` dřív chyběl.

## Hardware (OVĚŘENO)

```text
ELATEC TWN4  USB 09d8:0420  /dev/ttyACM0
    → ISO14443-A
NTAG I²C Plus 1K
    UID 04367F5A2D7280
    GET_VERSION 00 04 04 05 02 02 13 03
    → I²C write 0xAA / read 0xAB
CC2510  SDA P0_4  SCL P0_6  FD P1_1
    → USART0 EPD  E2266JS0C2
```

GPIO20 na Pi spíná **TWN4 USB 5 V**, ne tag. `ov26-relays.sh twn4-on`. I²C z MCU jen když RF pole není (FD high / `SetRFOff`).

## Dva protokoly

### A — SHOW (číslo slotu)

Krátký příkaz, grafika je **v ROM** (RLE).

| Cesta | Kam se píše | Payload |
|---|---|---|
| TWN4 `ov26-nfc-show.sh n` | NFC page `0x30` / I²C block `0x0C` | `OVH` + n (1–4) |
| Android NFC Tools | NDEF Text na page 4 / I²C `0x01` | znak `1`…`4` |

Firmware: `v0.10g` (jen TWN4), `v0.10i BIG` (NDEF má přednost před zůstatkem `OVH`).

| Slot | v0.10g (TWN4) | v0.10i Android |
|---|---|---|
| 1 | OpenVusionHack | BWR paleta 01–16 |
| 2 | paleta 01–16 | Radegast replika |
| 3 | Fry / money (TagStudio) | 400×300 letterbox na 296×152 |
| 4 | bílá / smazat | bílá / smazat |

LED (P2_1+P2_2) blikne jen při latchi. Zhasne = sundej čtečku. Refresh ~15 s.

**Chyby, které jsme opravili (v0.10i):** NDEF má přednost před leftover `OVH`; `wait_field_gone` má timeout; po show `nfc_consume()` až po zmizení pole.

Android **neposílá** celý obraz. Jen číslo slotu.

### B — Mailbox OVMB v1 (celý obraz)

Firmware `v0.12b_nfc_epd`. Host: `tag-send-image soubor.bin`.

```text
BIN 11248 B = 5624 + 5624   152×296   19 B/řádek
WHITE 0/0  BLACK 1/0  RED 0/1
SRAM I²C F8–FB  (NFC 0x40–0x4F po SRAM_MIRROR)
64 B frame: magic OVMB, typ BEGIN/DATA/COMMIT/ABORT/ACK, CRC-16, max 48 B payload
COMMIT: CRC-32 celého obrazu
0x12 jen po VERIFIED
```

EXP-066 protokol PASS · EXP-068 CoG+refresh PASS · EXP-069 ovhack na skle · EXP-070/071 host utility PASS.

## Stock NTAG (ElaTool, read-only)

```text
NDEF URL  https://nfc.imagotag.com/AA2CD0C9
SES ID    AA2CD0C9
blok 0x30–0x37  aplikační (stock), vlastní SHOW ho přepisuje OVH
```

Nezapisovat config/password na stock/golden.

## Co zbývá na NFC

- Android mailbox (celý BIN z telefonu)
- SMALL vs BIG slot sady podle panelu
- PTHRU stream za běhu RF (session `0xFE` write NACK — HYPOTÉZA omezení)
- FeliCa větev HWSniff je jiný čip / jiný tag
