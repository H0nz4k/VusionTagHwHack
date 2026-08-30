# Domácí použití GU140 + poznámky (senzory, sběrnice, nápady)

**Zapsáno:** 2026-08-31  
Hlavní linka v domě má být **vlastní rádio** (OVH RF, CC2500 na Pi ↔ CC2510 na tagu), ne NFC. NFC zůstává servisní kanál (SHOW, debug, telefon). Proč NFC v originálu existuje a proč z něj nejde vylovit MCU FW: [`nfc/WHY_NFC.md`](nfc/WHY_NFC.md).

Rozlišuj OVĚŘENO / REFERENCE / HYPOTÉZA.

---

## 1. Co máme za kusy (lab, 2026-08-31)

| Kus | Stav | Napájení flash |
|---|---|---|
| Malý bench DEV 2.6″ | SHOW `v0.10i`, unlocked | relé GPIO17 |
| Velké sklo (originál BIG) | stock byl **locked** → wipe + SHOW `v0.10i` | **bez baterie**, klema debugger **9↔2**, GPIO21 ON = VDD |
| Druhý TAG2 (dřív unlocked) | taky SHOW `v0.10i` | pin 9 |

Pin 9 utáhne MCU + `cc-tool`. **EPD refresh z pinu 9 není OVĚŘENÝ** — na první SHOW u BIG počítej s pádem napětí.

Klema 9↔2 na sense: kontinuita OK, 3,3 V na pinu 2 i s A5. Červená LED / No target bylo skoro vždy **USB dřív než TVCC**, nebo DD/DC/RESET. „Zkrat“ A4–A5 jen při USB = pull-up RESET na DVDD, ne kovový zkrat.

---

## 2. Komunikační linky na tagu

| Linka | Piny | Stav | Domácí použití |
|---|---|---|---|
| **I²C** bitbang | P0_4 SDA, P0_6 SCL, NTAG `0xAA` | **OVĚŘENO** | jediná sdílená sběrnice; čidla vedle NTAGu |
| NFC FD | P1_1 | **OVĚŘENO** pulse | ne data |
| **SPI EPD** USART0 | P0_3 MOSI, P0_5 SCLK, P0_1 CS | **OVĚŘENO** | jen CoG, ne čidla |
| **UART** USART1 | P1_6 TX | **OVĚŘENO** | lab; v domě zbytečný |
| SPI flash | P1_4…P1_7 | **HYPOTÉZA** | JEDEC ještě ne; RELATED `W25X10CL` 1 Mbit ([angrymew](https://github.com/angrymew/firmware-cc2510)) |
| **2.4 GHz** on-chip | `RFD` / `RFST` | UART dump **OVĚŘENO**, OTA **ne** | **hlavní domácí kanál**, až bude CC2500 |
| Debug DD/DC | P2_1 / P2_2 | **OVĚŘENO** | ne aplikace |

CC2510 **nemá** I²C periferii. Druhé I²C / UART RX na PCB není.

**P0_7:** u nás unknown. RELATED-MODEL ([angrymew GU140](https://github.com/angrymew/firmware-cc2510)): *not connected*. Kandidát na ADC / 1-Wire **až po continuity TAG OFF**. P2_3/P2_4 nikdy.

---

## 3. Čidla (nezkoušet dnes — jen plán)

Cíl: 3 V slave na stejném I²C jako NTAG, jiná adresa než `0x55` 7bit.

| Čidlo | Měří | Adresa | Proč |
|---|---|---|---|
| SHT40 / SHT30 | T + RH | `0x44`/`0x45` | málo proudu |
| BME280 / BMP280 | T + p (+RH) | `0x76`/`0x77` | „meteostanice na lednici“ |
| TMP117 / MCP9808 | jen T | `0x48`… | přesné |

```text
VCC → DVDD ~3 V     GND → AGND
SDA → P0_4          SCL → P0_6
```

Pravidla: ne 5 V; ne EPD SPI; I²C jen když NFC pole není; na pin 9 ne čidlo + refresh naráz; stock/golden nepájet. První FW: jen UART výpis T, bez `0x12`.

1-Wire (DS18B20) až na ověřeném P0_7. Analog NTC bez volného ADC nedává smysl.

---

## 4. Architektura doma (až bude rádio)

```text
Home Assistant / Node-RED / skript na Pi
        │
Raspberry Pi + CC2500 (OVH RF v0.1, ~10 kBaud GFSK, 2433 MHz)
        │  2.4 GHz
GU140 / BIG  CC2510  →  EPD B/W/R
        │
volitelně I²C čidlo na tom samém tagu
        │
NFC = jen servis (telefon SHOW, lab TWN4)
```

**Není** OpenEPaperLink (802.15.4 + ESP32 AP, jiný PHY). My stavíme vlastní OVH RF. Image 11 248 B už umíme přes NFC mailbox; vzduchem to samé po chuncích (návrh `docs/rf/IMAGE_TRANSFER.md` v sourozenci).

Tag je **displej s baterií**, ne náhrada telefonu. Update 1–6× za den, ne live dashboard.

---

## 5. Nápady, co zbastlit

Inspirace z OEPL / HA komunity (obsah, ne jejich rádio):
[HA + ESL](https://andrewgraham.dev/blog/electronic-shelf-labels-part-4-home-assistant/),
[busy / kalendář](https://chrishansen.tech/posts/Electronic_Shelf_Tag/),
[další event](https://musings.martyn.berlin/e-paper-price-tag-next-calendar-event),
[weather z mrtvého 2.6″](https://github.com/) (u nás `tools/weatherEpaperDisplay` = ESP místo CC2510 — to nechceme).

### Displeje po bytě (nejlepší fit)

| Nápad | Kde | Proč GU140/BIG |
|---|---|---|
| **Počasí + venkovní T** | předsíň / okno | BWR ikona, update 1–2 h |
| **Kalendář / další událost** | lednice, pracovna | červená = dnes |
| **Odvoz odpadu** | dveře | klasika OEPL; červená = zítra |
| **Nákupní seznam** | lednice | HA nákupy → BIN → RF |
| **MHD / „za 8 min bus“** | dveře | semafor černá/červená |
| **Cena elektřiny / FVE** | rozvaděč, kuchyň | spot 15 min; červená drahá |
| **BUSY / nerušit** | dveře pracovny | jeden slot, červený pruh |
| **Léky / pití vody** | koupelna | ranní refresh stačí |
| **Sklep / spíž inventura** | police | ESL jak v obchodě; NFC přepsat ručně |
| **Jméno na dveřích hosta** | pokoj | SHOW slot, RF jen když se mění |
| **Květiny / zálivka** | parapet | HA + volitelné I²C vlhkost |
| **Pračka/sušička hotovo** | prádelna | jeden bit + píp LED |
| **Teplota místností** | každá 2.6″ | Pi má čidla; tag jen kreslí |
| **BIG sklo = rodinný „denní list“** | kuchyňská stěna | počasí + kalendář + odpad + MHD na jednom větším panelu |

### S čidlem přímo na tagu (po I²C)

- **Sklepní klimatizace:** BME280 na BIG nebo 2.6″, 1×/h změří, jednou za čas pošle T/RH/p rádiem na Pi, sklo ukáže „12 °C / 78 %“.
- **Lednice zevnitř:** SHT40, pozor na kondenz a 3 V. Spíš vnější čidlo + tag na dveřích.
- **Radiátor / kotelna:** teplota na trubce (sonda), tag vedle — „zpátečka 42 °C“.

Měření na tagu dává smysl jen tam, kde **Pi nemá dosah** a nechceš další ESP. Jinak čidlo nech v HA a tag je jen displej — jednodušší, méně proudu.

### Hrátky, až bude RF stabilní

- Dva tagy: jeden ukazatel, druhý „tlačítko“ nejde (nemáme ověřený button). LED blik = ack.
- Noční režim: žádný refresh 22–6, šetří baterii (2× CR2450).
- NFC záloha: když rádio mlčí, telefon SHOW 1–4 pořád žije.

---

## 6. Co nestavět

- Kopírovat OEPL firmware na CC2510 — jiný stack.
- 5 V / Wi-Fi modul na tag.
- Live graf 1 Hz.
- Pájení čidel na BIG pod pin 9 dnes.
- Stock/golden jako domácí display, dokud není záměr wipe.

---

## 7. Pořadí, až bude čas (ne dnes)

1. CC2500 na Pi → RF-E…G PING/PONG.
2. Stejný BIN jako NFC mailbox, jen vzduchem.
3. Pi skript: HA sensor → TagStudio/BIN → RF.
4. Jeden 2.6″ „počasí“ jako first home demo.
5. BIG native rozlišení (296×152 SHOW na velkém skle je dočasné).
6. JEDEC flash (RELATED W25X10CL).
7. I²C čidlo na DEV, až bude jasné místo v bytě.
8. P0_7 continuity, kdyby byl 1-Wire potřeba.

---

## 8. Odkazy

- Vlastní RF: [`rf/README.md`](rf/README.md)
- NFC / I²C: [`nfc/README.md`](nfc/README.md)
- Sběrnice stručně: tento soubor §2
- [angrymew CC2510 GU140 pinout](https://github.com/angrymew/firmware-cc2510) — P0_7 NC, flash W25X10CL (**REFERENCE**)
- [OpenEPaperLink](https://github.com/OpenEPaperLink/OpenEPaperLink) — inspirace UX, ne PHY
