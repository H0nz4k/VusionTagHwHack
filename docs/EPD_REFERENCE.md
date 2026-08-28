# EPD Reference

## Klasifikace zdrojů

| Zdroj | Třída | Model |
|---|---|---|
| [Jirka Balhar, 2023](https://blog.jirkabalhar.cz/2023/12/hacking-sesimagotag-e-ink-price-tag/) | **EXACT-MODEL REFERENCE** | VUSION 2.6 BWR GU140, CC2510, E2266JS0C2 |
| `fanhuanji/VUSION4.2BWR_GL340` | **RELATED-MODEL REFERENCE** | 4.2" GL340, stejné MCU, jiný panel |
| Pervasive `EPD_Driver_GU_small` / EXT3 / Figure 5-1 | **REFERENCE** (datasheet/driver) | rodina E2266 iTC |
| Naše HIL EXP-003..005 | chování **OVĚŘENO**, identita pinů **ne** | náš DEV kus |

Balhar **není** OVĚŘENO na našem PCB revision. Stejná rodina (GU140 + E2266JS0C2), jiný fyzický kus, MCU později odstraněn.

---

## Co Balhar ověřil na GU140 (EXACT-MODEL REFERENCE)

Autor fyzicky pracoval s:

- VUSION 2.6 BWR GU140 (štítek EDG2-0260-A)
- TI CC2510, 32 kB
- panel potisk **SE2266JS0C2** = Pervasive **E2266JS0C2** (výrobce v manuálech vynechává vedoucí `S`)
- 2.66", 296×152, B/W/R

Postup:

1. Porovnal driving circuit z E2266JS0C2 reference manual (**Figure 5-1**) s GU140 PCB — *matches closely*.
2. Overlay top/bottom fotek, červeně vytrasoval spoje **k původnímu CC2510**.
3. CC2510 odpájel, na FPC/řídicí uzly napojil RP2040.
4. Pervasive Arduino: `eScreen_EPD_EXT3_266_BWR` + `PDLS_EXT3_Basic_Global`.
5. Panel **refreshoval** (obsah po pádu skla nečitelný, update proběhl).

Článek **neobsahuje tabulku CC2510 P0/P1/P2**. GPIO čísla z textu nejdou vyčíst. Overlay ukazuje ~7 spojů MCU → FPC v bloku řídicích/SPI pinů, plus VCC/GND pájecí plošky.

RP2040 strana (jen EXT3 signály, ne CC2510):

| EXT3 header | Signál | Pico (stock struct) | Balhar SPI remap |
|---|---|---|---|
| pin 3 Red | BUSY | GP13 | stejný GPIO | 
| pin 4 Orange | D/C | GP12 | stejný |
| pin 5 Yellow | RESET | GP11 | stejný |
| pin 2 Brown | SCK | GP18 | **GP2** |
| pin 7 Blue | MOSI | GP19 | **GP3** |
| pin 9 Grey | CS | GP17 | **GP1** |
| pin 6 Green | MISO | GP16 | nepoužit pro update |

`panelPower` v novějších `pins_t` Balhar v citovaném structu neměl. Napájel desku 3V3 na VCC pad po odstranění bateriových nohou — on-board **EPD_PWR MOSFET mohl obejít**. Na našem kusu PWR GPIO pořád potřebujeme.

Komentář u článku: Figure 5-1 má i 7. signál (power). To sedí s GL340 `P0_0`.

---

## Pervasive E2266JS0C2 — FPC 24pin (REFERENCE, Figure 5-1)

Z schématu, které Balhar přiložil a prohlásil za shodu s GU140 PCB:

| FPC | Signál | Poznámka |
|---|---|---|
| 8 | BS | 4-wire vs 3-wire; na tagu typicky **pevně strapnutý**, ne MCU GPIO |
| 9 | BUSY_N | GPIO in. Pervasive EXT3: **L = busy, H = ready** |
| 10 | RST_N | GPIO out, active low |
| 11 | DC | GPIO out, L=command H=data |
| 12 | CSB | SPI CS, active low |
| 13 | SCL | SPI SCLK |
| 14 | SDA | SPI MOSI (write-only k CoG) |
| 15 / 16 | VDDIO / VDD | za **power switch** („prevent leakage“) = **EPD_PWR** na MCU, ne FPC pin |
| 2 / 3 | GDR / RESE | boost MOSFET na desce, ne CC2510 GPIO |
| 17 | GND | |
| 1,4,6,7,19 | NC | |

**MISO / P0_2 není v first-refresh sadě.** P0_2 nech **input / untouched**, dokud driver krok výslovně nebude potřebovat čtení. First write/refresh používá jen:

```text
P0_0 PWR
P0_1 CS
P0_3 MOSI
P0_5 CLK
P1_2 DC
P1_3 BUSY
P2_0 RESET
```

BUSY polarita pro **iTC E2266** ber z Pervasive (`wait until HIGH`), ne z SSD1680 tabulek (tam bývá opačně).

---

## CC2510 mapa: GL340 vs exact-model

GL340 `src/display/epd.h` (RELATED-MODEL REFERENCE):

```c
EPD_PWR   P0_0   /* PWR_ON: P0_0 = 0  (active low) */
EPD_CS    P0_1
EPD_DC    P1_2
EPD_BUSY  P1_3   /* wait while == 0  → ready = HIGH */
EPD_RESET P2_0   /* active low */
/* SPI USART0 Alternative 1: P0_3 MOSI, P0_5 SCLK; P0SEL bits 3+5 */
```

Porovnání s kandidáty z tohoto projektu:

| Signál | GL340 CC2510 | Exact-model GU140 (Balhar) | Shoda | Naše označení |
|---|---|---|---|---|
| EPD_PWR | P0_0, active LOW | Figure 5-1 power switch; Balhar GPIO nepublikoval | signál ano, pin z GL340 | **REFERENCE** |
| EPD_CS | P0_1 | FPC 12 CSB → MCU (overlay) | ano, pin z GL340 | **REFERENCE** |
| EPD_DC | P1_2 | FPC 11 DC → MCU | ano | **REFERENCE** |
| EPD_RESET | P2_0 | FPC 10 RST_N → MCU | ano | **REFERENCE** |
| EPD_BUSY | P1_3 | FPC 9 BUSY_N → MCU | ano | **REFERENCE** |
| EPD_MOSI | P0_3 USART0 Alt1 | FPC 14 SDA → MCU | ano | **REFERENCE** |
| EPD_SCLK | P0_5 USART0 Alt1 | FPC 13 SCL → MCU | ano | **REFERENCE** |
| MISO | P0_2 | mimo first-refresh; nechat input | — | **mimo scope** |

Kde exact-model (FPC + „schematic matches PCB“ + overlay k CC2510) a GL340 (konkrétní P0/P1/P2) ukazují **stejnou sadu signálů**, jistota stoupá. **Stále REFERENCE**, dokud to na našem kusu nepotvrdí experiment.

USART0 Alt1: MOSI+SCLK na P0_3/P0_5, CS bitbang P0_1. **P0_2 neselectovat.** P0_4 je na VUSION spíš NFC SDA.

---

## P2_0 / EPD_RESET — klasifikace

**REFERENCE:** `P2_0` = EPD_RESET candidate (GL340 + FPC 10 RST_N).

**HISTORICAL OBSERVATION:** starší experiment zahrnující P2_0 (EXP-006, v0.3e, jiné podmínky debugger/RESET_N) koreloval s reset stormem.

**UNKNOWN:** kauzalita `P2_0 → reset MCU` **není prokázána**. Storm nepovyšuj na vlastnost EPD_RESET/P2_0.

**OVĚŘENO (EXP-024, isolation):** P2_0 H-L-H po P0_0=0, GPIO27+21 `dh`: MCU nestormuje (`RESET_CAUSE=01`, 1× banner, heartbeat). Historický storm se za těchto podmínek nereprodukoval.

EXP-C (RESET H-L-H) opakuj **jen** s aktuálním isolation workflow: GPIO27 `dh` (RESET_N+DD+DC odříznuté), GPIO21 `dh`, TAG ON jen 3 V.

---

## Co z overlay fotky nejde

Červené čáry končí u QFN padů, ale Balhar nepodepsal GPIO jména. Přiřazení pad → GPIO z fotky samotné je náchylné na rotaci pouzdra a pin-1 marker. Bez continuity na našem kusu to nepovyšuj.

---

## Bring-up po LED continuity — EXP-A … EXP-H

Cíl: `milestone/epd-first-refresh`.

Start až po LED continuity (společný sink vs tři FET). Isolated debugger. Žádný GPIO sweep. P2_3/P2_4, P0_3 jako UART, P0_2 drive — zakázáno.

Každá vrstva = jeden HIL test. **Bez konzistentního výsledku nepokračuj.** Po každém stupni: `docs/EXPERIMENT_LOG.md` + samostatný commit.

| EXP | Vrstva | Co budit | PASS (konzistentní) |
|---|---|---|---|
| A | passive BUSY | nic; P1_3 input | 1× banner, P1_3 čitelný, MCU žije po celý capture |
| B | PWR only | P0_0 OFF→ON; bez RESET/SPI | MCU žije; log PWR+BUSY; žádný reset storm |
| C | RESET H-L-H + BUSY | po PWR ON: P2_0 1→0→1; P1_3 vzorkovat | EXP-024 PASS MCU; P1_3 0→1 po H2 (silná evidence BUSY, identita ne OVĚŘENO) |
| D | SPI idle / clock | USART0 Alt1, CS=1, P0_3/P0_5 periferní, **žádný byte** | EXP-025 PASS config; P0SEL=28, P0_2 DIR/SEL=0, CS=1; mapa MOSI/SCLK ne OVĚŘENO |
| E | command `0x00` + data `0x0E` | soft-reset, wait BUSY s timeoutem | EXP-026 PASS TX/UART; P1_3 zůstal 1 (CoG ACK INCONCLUSIVE) |
| F | minimal reference init | GU-small non-4.2: E5=19, E0=02, PSR CF 8D | EXP-027 PASS TX; BUSY HIGH |
| G | blank framebuffer load | `0x10` / `0x13` prázdné roviny, **ne** `0x12` | EXP-028 PASS 15F8+15F8 |
| H | `0x12` refresh | první blank refresh | EXP-029 PASS UART; P1_3 po 0x12: 1→0 (~15 s)→1 |
| I | B/W test pattern | streamované pruhy + `0x12` | EXP-030 **OVĚŘENO vizuálně** — vlastní B/W pruhy na panelu |

Harmless command je EXP-E. `0x12` jen v EXP-H.

Pervasive reset tvar (REFERENCE): RESET 1 → 0 → 1, CS idle, pak command.

Starší EXP-003..006 **nenahrazují** A–C. Byly za jiného debugger/RESET_N režimu. A–H jet znovu s isolation workflow.

---

## Gating k first refresh

Než EXP-H `0x12`: EXP-A…G musí mít konzistentní PASS (ne 3× stejná failure signature).

`P1_3 == 1` samo o sobě **není** potvrzení BUSY. EXP-024: přechod **0→1 vázaný na uvolnění P2_0** po PWR ON. EXP-029: po `0x12` **1→0 (~15 s)→1**. EXP-030: lidská fotka vlastních B/W pruhů — first-refresh GPIO sada jako celek **OVĚŘENO**.

## B/W/R encoding (OVĚŘENO EXP-032)

Native framebuffer: **152 px × 296 řádků**, 19 B/řádek, 5624 B/rovinu. (Pervasive `_screenSizeH=152`, `_screenSizeV=296`. 37 B/řádek = diagonály, EXP-031.)

```text
WHITE = plane10 0, plane13 0
BLACK = plane10 1, plane13 0
RED   = plane10 0, plane13 1
```

MSB first v bytu = levý pixel. `milestone/display-bwr`. `v0.4k_bwr_19` = baseline.

EXP-033 first content (stejný encoding, jiný framebuffer): čitelné OpenVusionHack. `milestone/display-first-content`. Fotka `captures/ov26_exp033_visual.png`.
