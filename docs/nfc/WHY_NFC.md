# Proč má štítek NFC (a proč to není cesta do původního FW)

NFC u Vusion **není backdoor do firmwaru MCU**. Je to druhý, pomalý kanál vedle rádia. Telefon nemluví s CC2510; píše do NTAGu. MCU si to přečte po I²C, až RF pole zmizí.

## Dva kanály

| | Rádio (2.4 GHz / 868) | NFC (13.56 MHz) |
|---|---|---|
| Dosah | obchod / byt (až bude OVH RF) | centimetriy, přiložení |
| Kdo mluví | AP / náš Pi+CC2500 | telefon, TWN4 |
| Typická data | ceny, stránky, OTA, u nás BIN obraz | URL, ID, krátký příkaz, mailbox |
| Kdy | štítek se probudí sám | člověk stojí u kusu |

Bez NFC by štítek uměl jen to, co mu pošle AP. NFC je „když stojím u něj“.

## K čemu NFC v originálu je (OVĚŘENO / REFERENCE)

1. **Zákazník / personál** — NDEF URL `https://nfc.imagotag.com/…` + SES ID. Naměřeno ElaTool: UID `04367F5A2D7280`, SES `AA2CD0C9`, blok EEPROM `0x30–0x37`.
2. **Active NFC** — stock FW po přiložení čtečky **listuje přednahrané stránky** na skle. Není to nahrání celého nového obrazu z telefonu.
3. **Mailbox I²C** — MCU ↔ NTAG SRAM (64 B). Příkaz, stav, konfigurace. Stejný duch má náš OVMB (11 248 B po chuncích).
4. **Párování / servis** — identifikace kusu bez rádia (UID, SES ID).

## Co děláme my

Stock Active NFC a imagotag URL **neimplementujeme**. Náš SHOW čte jen `1`–`4` (NDEF) nebo `OVH`+n (TWN4). Mailbox `v0.12b` je vlastní protokol.

Proto to vypadá chudě proti originálu, který z NFC listuje stránky. To **není** lockpick do binárky CC2510.

## NFC ≠ program MCU

| Paměť | Co v ní je | NFC na to sahá? |
|---|---|---|
| NTAG EEPROM ~1 kB + SRAM 64 B | NDEF, SES ID, mailbox | ano (RF) |
| CC2510 flash 32 kB | **originální / náš firmware** | **ne** |

Stock MCU FW je locknutý. `cc-tool -t` → `Target is locked` → zápis jen po mass erase. NFC lock MCU neodemyká.

NTAG dump (ElaTool) **není** dump CC2510.

## Co zbylo z originálu na našich kusech

| Kus | MCU FW |
|---|---|
| Bench DEV 2.6″ | smazaný už při startu výzkumu |
| BIG sklo (4.2″, 2026-08-31) | locked stock → **mass erase** → `v0.10i`. Originál **pryč** |
| Stock/golden | originál — **bez souhlasu nemazat** |

Zpět na BIG/DEV: jen kdyby existoval **Intel HEX / dump CC2510** z doby před wipe. Z NFC se stock FW znovu nenatáhne.

Obnova = `cc-tool -e -w stock.hex` na už odemčený kus. To je nahrání binárky, ne „vstup přes NFC“.

## Dál u našeho FW

- NFC = servis bez rádia (telefon SHOW, lab TWN4).
- Mailbox už umíme — stejný princip jako stock, náš protokol.
- Doma hlavní kanál = rádio (`docs/rf/`, `docs/HOME_USE.md`).
