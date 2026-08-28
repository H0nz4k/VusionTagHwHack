# OpenVusion 2.6 GU140

Vlastní firmware na elektronickém cenovkovém štítku **VUSION 2.6 BWR GU140** (TI **CC2510** + Pervasive **E2266JS0C2**).

![OpenVusionHack on DEV tag — OpenVusion black, Hack red, white background](captures/ov26_exp033_visual.png)

**EXP-033 / `milestone/display-first-content` (OVĚŘENO vizuálně):**  
**OpenVusion** = černá · **Hack** = červená · pozadí = bílá.

**Aktuální NFC SHOW firmware: `v0.10g`** (strom `v0.10e_nfc_show3`) — čtyři volby přes TWN4.

Lab sestava a kusovník: [`docs/HARDWARE.md`](docs/HARDWARE.md) · fotka [`captures/ov26_lab_bench.png`](captures/ov26_lab_bench.png)  
Sloty a paleta 01–16: [`docs/nfc/SHOW_SLOTS.md`](docs/nfc/SHOW_SLOTS.md)

![Volba 3 na DEV tagu — Shut up and take my money](captures/ov26_exp056_slot3_glass.png)

| Volba | Grafika |
|---|---|
| 1 | OpenVusionHack |
| 2 | BWR test 01–16 |
| 3 | Shut up and take my money |
| 4 | Smazat / bílá |

Postup nahrání na nový DEV tag: [`firmware/releases/README.md`](firmware/releases/README.md)

```bash
ssh vusion-rpi
/home/hw/bin/ov26-flash-show.sh    # erase+write CC2510 (jen DEV)
/home/hw/bin/ov26-nfc-show.sh      # menu 1/2/3/4
```


Offline bitmapa (152×296, dvě 1bpp roviny) streamovaná stejnou CoG sekvencí, která předtím zvládla B/W pruhy a kalibrační BLACK | WHITE | RED.

## Co to je

Originální firmware na jednom obětovaném DEV kusu je smazaný. Na tom kusu běží vlastní SDCC firmware: UART diagnostika, řízení EPD (power / reset / SPI / BUSY / refresh) a streamování B/W/R framebufferu.

Cíl není „hacknout síť“, ale pochopit hardware a postavit vlastní, kontrolovaný stack:

```text
stabilní boot → UART → GPIO map → EPD power/reset/busy
→ first command → first refresh → B/W → B/W/R → first content
→ flash → NFC → LED → RF → vlastní protokol
```

## Hardware

| | |
|---|---|
| Štítek | VUSION 2.6 BWR GU140, panel 2.66″ |
| MCU | Texas Instruments CC2510 (QFN-36, ID `0x2510`) |
| Displej | Pervasive Displays E2266JS0C2, native **152 × 296**, B/W/R |
| Programátor | TI CC Debugger clone (`0451:16a2`), `cc-tool` |
| UART | USART1 Alt2, TX = P1_6, 115200 8N1, CP2102 RX only |
| Lab | Raspberry Pi relé: GPIO17 = tag 3 V, GPIO27 = RESET/DD/DC, GPIO21 = debugger USB 5 V |

Relé jsou NO, active-low: `dl` = ON, `dh` = OFF. Tag je ~3 V systém (stock: 2× CR2450 paralelně). Debugger pin 9 (3.3 V out) se nepřipojuje.

**DEV tag** lze opakovaně flashovat. **Stock/golden tagy** se bez explicitního souhlasu nijak nemažou, neflashují ani nelockují.

## Milníky

| Tag | Co je OVĚŘENO |
|---|---|
| `milestone/epd-first-refresh` | `0x12` + BUSY HIGH→LOW (~15 s)→HIGH |
| `milestone/display-test-pattern` | vlastní B/W pruhy na skle |
| `milestone/display-bwr` | souvislé BLACK \| WHITE \| RED |
| `milestone/display-first-content` | čitelný nápis OpenVusionHack |
| `v0.10e-nfc-show` | TWN4 WRITE → tři BWR grafiky na skle |

Známý-good BWR baseline firmware: `v0.4k_bwr_19` (neměnit). First content: `v0.4l_ovhack` (jen jiný framebuffer).

## B/W/R encoding (OVĚŘENO)

Dvě roviny po **5624 B** (19 B/řádek × 296 řádků). MSB v bytu = levý pixel.

```text
WHITE = plane10 0, plane13 0
BLACK = plane10 1, plane13 0
RED   = plane10 0, plane13 1
```

Špatný stride 37 B/řádek (EXP-031) míchá barvy do diagonál. Native 19 B (152/8) je EXP-032.

Text na MCU nerenderujeme: `scripts/gen_ovhack_bwr.py` vygeneruje bitmapu offline a zapíše `img_ovhack.c`.

## EPD pipeline (neměnit bez důvodu)

```text
PWR P0_0 active LOW
→ RESET P2_0 H-L-H
→ USART0 Alt1: MOSI P0_3, SCLK P0_5, CS P0_1, DC P1_2, BUSY P1_3
→ 0x00/0x0E, 0xE5/0x19, 0xE0/0x02, 0x00/0xCF 0x8D
→ 0x10 plane + 0x13 plane (5624 B each)
→ DCDC 0x04/0x00
→ refresh 0x12/0x00
```

P0_3 není diagnostický UART. P2_3/P2_4 se nikdy nekreslí jako GPIO. Runtime EPD testy jedou s odpojeným debuggerem (GPIO27+21 `dh`).

## Repo mapa

```text
AGENTS.md          pravidla pro autonomního agenta
START_HERE.md      bootstrap lab stroje
firmware/          SDCC zdroje (lokální source of truth)
scripts/           build, flash, UART, generátor bitmap
docs/              STATUS, experimenty, pinout, EPD reference
captures/          UART dumpy + lidské fotky panelu
```

Vzdálený lab: `ssh vusion-rpi` → `/home/hw/OpenVusion26_FW`.  
Branch: `research/nfc-gu140`.

## Cursor agent (tento adresář)

Otevři tento adresář **lokálně ve Windows v Cursoru**. Je source of truth pro dokumentaci, Git historii a firmware po stažení z RPi.

Laboratorní Raspberry Pi: SSH alias `vusion-rpi` (klíč, bez hesla).

První prompt:

```text
Přečti AGENTS.md a všechny soubory v docs/. Potom spusť bootstrap podle START_HERE.md.
Pracuj autonomně podle pravidel projektu.
```

Na **ověřeném DEV tagu** může agent buildovat, flashovat, power-cycle, číst UART a opakovat kontrolované experimenty bez potvrzení u každého flashe. Nesmí fyzicky přepojovat vodiče a nesmí ničit stock/golden tagy.
