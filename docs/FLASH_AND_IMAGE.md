# Nahrání firmware a obrázku

Dva různé příkazy. **Nezaměňuj je.**

| Účel | Příkaz | Vstup |
|---|---|---|
| Flash MCU přes CC Debugger | `tag-flash-latest` | ověřený HEX z `firmware/releases/` |
| Grafika přes TWN4/NFC | `tag-send-image soubor.bin` | headerless TagStudio BIN, přesně **11 248 B** |

HEX firmware **není** obrazový BIN. BIN **není** firmware.

## Instalace na Raspberry Pi

Z checkoutu:

```bash
cd /cesta/k/VusionTagHwHack
./tools/install-tag-utils.sh
# výchozí PREFIX=$HOME/bin
# odinstalace: ./tools/install-tag-utils.sh --uninstall
```

Skript ukáže, kam symlinky půjdou. Znovu spuštění je bezpečné. Cizí soubor stejného jména **nepřepíše**.

Bez instalace:

```bash
./tools/tag-flash-latest --help
./tools/tag-send-image --help
```

## Běžný postup (DEV tag)

1. DEV tag na CC Debugger (GND, DVDD sense, DD, DC, RESET). Pin 9 programátoru **nepřipojuj**.
2. Nahraj firmware:

```bash
tag-flash-latest --confirm-dev-tag --yes
```

3. Debugger může zůstat odpojený relé (utilita skončí v `idle`).
4. Pošli grafiku (TWN4 fyzicky nad anténou):

```bash
tag-send-image captures/nfc/art/ovhack.bin
```

Preflight bez zápisu:

```bash
tag-flash-latest --dry-run
```

## Potvrzení DEV

CC2510 **nelze** softwarově spolehlivě odlišit od golden/stock. Utilita proto vyžaduje `--confirm-dev-tag`. `--yes` platí jen s tímto potvrzením. Golden/stock **neflashuj**.

## Návratové kódy

| rc | Význam |
|---|---|
| 0 | Flash: verify PASS. Send: host `DONE`. |
| 2 | Špatný vstup (délka BIN, chybějící soubor, chybí `--confirm-dev-tag`, špatný SHA-256). |
| 3 | Cíl není CC2510 nebo je LOCKED. |
| 4 | Chybí CC Debugger / relé / TWN4. |
| 5 | Timeout nebo selhání erase/write/verify / NFC session. |
| jiné | Chyba z `cli.py send` (UID, CRC, ABORT, ERROR). |

## Zapojení

- Flash: lab relé, TWN4 **vypnutá**, `ov26-relays.sh attach`.
- NFC: tag 3 V, TWN4 `/dev/ttyACM0`, USB `09d8:0420`, UID `04367F5A2D7280`.
- `/dev/ttyUSB0` je CP2102 UART, **ne** TWN4.

## Nejčastější chyby

| Symptom | Co zkontrolovat |
|---|---|
| CC Debugger se nenašel | USB `0451:16a2`, `attach`, zelená LED / TVCC |
| TWN4 na jiném portu | jen `/dev/ttyACM0`; ne `ttyUSB0` |
| špatná délka BIN | musí být 11248; PNG/C/HEX se odmítnou |
| tag nenalezen | TWN4 nad anténou, tag ON, UID `04367F5A2D7280` |
| SHA-256 nesouhlasí | neměň HEX; vrať `firmware/releases/v0.12b_nfc_epd.hex` |

Po každém běhu (úspěch i chyba) utilita volá `idle`: tag, TWN4, debugger OFF.

Aktuální ověřený release je v [`firmware/releases/latest.json`](../firmware/releases/latest.json), ne podle data souboru.
