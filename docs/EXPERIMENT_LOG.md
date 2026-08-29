# Experiment Log

Přidávej nové experimenty nahoru.

---

### EXP-20260829-068 — 11248 B → CoG → 0x12

**Status:** **PASS** A/B/A DONE; faults rc≠0; UART `REF=01` BUSY `00→01` GOT=`2BF0`

`docs/experiments/EXP-068.md`. `v0.12b_nfc_epd`.

---

### EXP-20260829-067 — CoG stays init during NFC chunks

**Status:** **PASS** INIT=01, P10=01, P13=01 across 235 RF/I²C turnovers

`docs/experiments/EXP-067.md`.

---

### EXP-20260829-066 — OVMB protocol HIL no EPD

**Status:** **PASS** crc/skip/e2e rejected; three full 11248 B DONE (`6645BA54`, `429BC5BF`, `6645BA54`)

`docs/experiments/EXP-066.md`. `v0.12a_nfc_proto`.

---

### EXP-20260829-065 — I2C-idle then MCU 64 B SRAM dump

**Status:** **PASS** F8–FB = `00…3F` after RF payload64. `docs/experiments/EXP-065.md`

---

### EXP-20260829-064 — RF 64 B SRAM window

**Status:** RF 64 B **PASS** (3×); MCU UART after RF **INCONCLUSIVE** garbage; one NAK 0x48 during I2C poll. `docs/experiments/EXP-064.md`

---

### EXP-20260829-063 — 16B I2C config RMW → SRAM mailbox

**Status:** I2C `0x3A` 16 B PRE=`1B 00 10 48…`; RF `E8` **PASS** `1B 00 10 48`; RF `0x40` seq **PASS**; I2C `0xF8` = `63 A5…0D`, I2C `0x10` stále `OVMB` → SRAM **PASS**

`docs/experiments/EXP-063.md`. Firmware `v0.11g_nfc_cfg3a_16b`.

---

### EXP-20260829-062 — I2C config 0x3A SRAM_MIRROR

**Status:** I2C 0x3A ACK; peek E8 **nezměněno**; WRITE 0x40 OVMB (user page) **PASS**; SRAM_MIRROR **FAIL**

`docs/experiments/EXP-062.md`.

---

### EXP-20260829-061 — RF WRITE config E8 SRAM_MIRROR

**Status:** TWN4 UID OK; **FAIL** WRITE E8 NAK 0x0; REG_LOCK=0x01; E8 unchanged

`docs/experiments/EXP-061.md`.

---

### EXP-20260829-060 — RF WRITE session 0xEC + SRAM poll

**Status:** flashed DEV; TWN4 UID OK; **FAIL** WRITE EC NAK 0x0; UART SRAM zeros

`docs/experiments/EXP-060.md`.

---

### EXP-20260829-059 — session I2C write 0x19

**Status:** flashed DEV; UART **FAIL** ACKNC=00 (same as 0x59)

Not the PTHRU bit. `docs/experiments/EXP-059.md`.

---

### EXP-20260829-058 — I2C PTHRU 0x59 + TWN4 F0

**Status:** flashed DEV; UART **FAIL** ACKNC=00; TWN4 **INCONCLUSIVE** no_tag

`docs/experiments/EXP-058.md`.

---

### EXP-20260829-057 — I2C SRAM 0xF8 read

**Status:** flashed DEV; UART **PASS** ACKAB=01 SRAM zeros

`v0.11a_nfc_sram`. Same Sr as EXP-049, word `0xF8`. `docs/experiments/EXP-057.md`.

---

### EXP-20260828-056 — SHOW slot 3 new TagStudio zip

**Status:** flashed DEV; UART **PASS**; glass slot 3 **PASS**

Zip `TAG_Project_2026-08-28_22-28-47`. `su` RLE 10508+3762. `docs/experiments/EXP-056.md`.

---

### EXP-20260828-055 — SHOW slot 4 blank white refresh

**Status:** flashed DEV; UART wait **PASS**; pending human blank glass

Volba 4 = CoG init + obě roviny `0x00` (bílá), bez čtvrté RLE bitmapy. Latch `OVH`+4. `docs/experiments/EXP-055.md`.

---

### EXP-20260828-054 — Three SHOW slots + Python menu

**Status:** flashed DEV; UART wait PASS; pending human menu glass

1 OVH, 2 BWR test, 3 Shut up. `show_app.py`. `docs/experiments/EXP-054.md`.

---

### EXP-20260828-053 — SHOW slot 4 Shut Up And Take My Money

**Status:** flashed DEV; UART wait PASS; pending `show 4` glass

TagStudio `296×152` BIN/C → native RLE. Four images, 32 kB flash. `docs/experiments/EXP-053.md`.

---

### EXP-20260828-051 — I2C-clear NTAG dynlock for RF WRITE 0x30

**Status:** UART **PASS** (I²C E2 already 00); RF WRITE pending `show 2`

PWD_AUTH PACK `00 00`, WRITE still NAK. AUTH0=`FF` (not password). `E2` dynlock. `v0.10b_nfc_unlock`. `docs/experiments/EXP-051.md`.

---

### EXP-20260828-050 — NFC SHOW EEPROM command 1/2/3

**Status:** UART wait **PASS**; WRITE NAK = dynlock (EXP-051)

`v0.10a_nfc_showcmd` on DEV. `WAIT LED=00`. Host: `ov26-nfc-show.sh 1|2|3`. `docs/experiments/EXP-050.md`.

---

### EXP-20260828-049 — I2C EEPROM read (not session 0xFE)

**Status:** **PASS** ACKAB=01

`v0.6f_nfc_eep`. Word 0x01 then 0xAB ACK, 8 B non-FF. Session 0xFE was the FAIL, EEPROM read works. `docs/experiments/EXP-049.md`.

---

### EXP-20260828-048 — NFC show baked graphics 1/2/3

**Status:** firmware+script ready; pending human menu run

`v0.9a/b/c_nfc_show*`. LED off until FD, 250 ms blink during refresh. Pi: `ov26-nfc-show.sh`. `docs/experiments/EXP-048.md`.

---

### EXP-20260828-047 — NFC field triggers EPD refresh

**Status:** **PASS**

`v0.8a_nfc_refresh`. TWN4 `in_field true` UID `04367F5A2D7280`, 36 hits/60 s. Human: refresh. UART `HB BUSY=1`. Wait-loop LED blinks while ARMED (confusing, not field). `docs/experiments/EXP-047.md`.

---

### EXP-20260828-046 — 1 Hz LED while TWN4 in range

**Status:** PASS UART idle; blink rate čeká člověka

`v0.7b_nfc_fd_1hz`. Sticky FD poll, 0.5 s on/off. Isolated UART PASS. TAG ON for `field-watch`. `docs/experiments/EXP-046.md`.

---

### EXP-20260828-045 — NFC-C FD + LED vs TWN4

**Status:** PASS firmware / FAIL proximity (hits=0)

`v0.7a_nfc_fd_led`. FD idle=1, LED off. `field-watch` běží. Čtečka teď tag nevidí. `docs/experiments/EXP-045.md`. TAG OFF.

---

### EXP-20260828-044 — NFC-B STOP+START before 0xAB

**Status:** FAIL (ACKAB=00)

Stejné ACKAA/ACKFE, 0xAB stále NACK. `docs/experiments/EXP-044.md`. TAG OFF.

---

### EXP-20260828-043 — NFC-B session 0xFE repeated start

**Status:** FAIL session / PASS UART

ACKAA=01 ACKFE=01 ACKAB=00 SESS FF×8. `docs/experiments/EXP-043.md`.

---

### EXP-20260828-042 — CP2102 framing after cc-tool

**Status:** PASS as diagnosis

Isolated flash garbage ≠ MCU. 115200 recapture of v0.5c PASS. `docs/experiments/EXP-042.md`.

---

### EXP-20260828-041 — UART-only NFC control image

**Status:** PASS on recapture

`v0.6c_nfc_uart`. Isolated FAIL, recapture EXP-041 DONE. `docs/experiments/EXP-041.md`.

---

### EXP-20260828-040 — NFC-A I2C ACK 0xAA

**Status:** PASS UART

`v0.6b_nfc_ack0` ACK0=01. P0_4/P0_6 **OVĚŘENO**. Bez P1_0. `docs/experiments/EXP-040.md`.

---

### EXP-20260828-039 — NFC-A dual-pass first image

**Status:** INCONCLUSIVE (invalid UART capture)

`v0.6a_nfc_ack`. Post-cc-tool high-bit garbage. `docs/experiments/EXP-039.md`.

---

### EXP-20260828-038 — NFC-0 TWN4 UID / GET_VERSION

**Status:** PASS

UID `04367F5A2D7280`, GET_VERSION Plus 1K. `/dev/ttyACM0`. `docs/experiments/EXP-038.md`. TAG OFF after probe.

---

### EXP-20260828-037 — RF-D TX ping

**Status:** FAIL UART / OTA NOT VERIFIED

`v0.5d_rf_txping`. Capture garbage. CC2500 absent. `docs/experiments/EXP-037.md`. TAG OFF.

---

### EXP-20260828-036 — RF-C bounded RX/RSSI

**Status:** PASS UART

SRX MARC=0D, RSSI 0C–0E (not 80), SIDLE. `docs/experiments/EXP-036.md`. TAG OFF.

---

### EXP-20260828-035 — RF-B profile IDLE

**Status:** PASS UART

Profile readback MATCH, CAL, MARC IDLE. `docs/experiments/EXP-035.md`. TAG OFF.

---

### EXP-20260828-034 — RF-A radio dump

**Status:** PASS UART

Silicon defaults vs SWRS055. PART=81 VER=04. No TX. `docs/experiments/EXP-034.md`. TAG OFF.

---

### EXP-20260828-033 — OpenVusionHack first content

**Status:** PASS UART + **OVĚŘENO vizuálně** (OpenVusion černě, Hack červeně, pozadí bílé)

Offline 152×296 BWR bitmap, stejný CoG flow. `docs/experiments/EXP-033.md`. Fotka `captures/ov26_exp033_visual.png`. TAG OFF. `milestone/display-first-content`.

---

### EXP-20260828-032 — B/W/R 19 bytes/row

**Status:** PASS UART + **OVĚŘENO vizuálně** (BLACK \| WHITE \| RED + marker)

Jediná změna: native stride 19 B (152/8). Stejné kódování. `docs/experiments/EXP-032.md`. TAG OFF.

---

### EXP-20260828-031 — B/W/R calibration (official red = 10:0 13:1)

**Status:** PASS UART / vizuál: náznak červené, diagonály (špatný stride)

Isolated. Stejný BUSY 1→0→1. Tři pásy + černý marker. Encoding hypotéza: W=00/00 B=FF/00 R=00/FF. `docs/experiments/EXP-031.md`. TAG OFF.

---

### EXP-20260828-030 — vertical B/W stripes + second 0x12

**Status:** PASS UART + **OVĚŘENO vizuálně**

Isolated. Stejný BUSY 1→0 (HB 00–16)→1 jako EXP-029, jiný framebuffer (37 B/řádek, 0x00/0xFF). Lidská fotka: celý panel vlastní B/W pruhy. `docs/experiments/EXP-030.md`. `captures/ov26_exp030_por.bin`, `captures/ov26_exp030_visual.png`. TAG OFF.

---

### EXP-20260828-029 — Phase H DCDC 0x04 + refresh 0x12

**Status:** PASS UART / STRONG EVIDENCE refresh; vizuál potvrzen navazujícím EXP-030

Isolated. INIT/N10/N13/DCDC/REF=01. Po `0x12` P1_3: 1→0 (HB 00–16)→1 (HB 17+). Žádný storm. `docs/experiments/EXP-029.md`. Capture `captures/ov26_exp029_por.bin`. TAG OFF.

---

### EXP-20260828-028 — Phase G framebuffer 5624+5624

**Status:** PASS

Isolated. INIT=01, N10=N13=15F8, BUSY=1. White FF/00 dle Pervasive BWR demo. `docs/experiments/EXP-028.md`.

---

### EXP-20260828-027 — Phase F minimal init register_data_sm

**Status:** PASS UART/TX

Isolated. SR/E5/E0/PSR =01, BUSY=1, MCU žije. První obraz UART garbage (helpers); flatten jako v0.4e. `docs/experiments/EXP-027.md`.

---

### EXP-20260828-026 — Phase E command 0x00 + data 0x0E

**Status:** PASS UART/TX / INCONCLUSIVE CoG BUSY ACK

Isolated. `TX0=01` `TX1=01`, MCU žije, P0_2 čistý, CS HIGH. P1_3 zůstal 1 (SAW0=00). Detail `docs/experiments/EXP-026.md`. Další: ne `0x12`; vyhodnotit před min init.

---

### EXP-20260828-025 — Phase D SPI idle (USART0 Alt1)

**Status:** PASS (konfigurace bezpečná; MOSI/SCLK mapa ne OVĚŘENO)

Isolated. PWR ON, H-L-H, WAIT OK n=01 BUSY=1. POST `P0SEL=28` `P0DIR=2B` `U0CSR=00` `U0GCR=31`. P0_2 SEL/DIR=0, CS=1, žádný byte, HB 00–17. Detail `docs/experiments/EXP-025.md`. Další: EXP-026 `0x00`/`0x0E`.

---

### EXP-20260828-024 — Phase 3 PWR ON + P2_0 H-L-H

**Status:** PASS MCU/UART / STRONG EVIDENCE P1_3 kandidát BUSY

Isolated (GPIO27+21 dh). P0_0=0, P2_0 HIGH→LOW→HIGH, žádné SPI. `RESET_CAUSE=01`, 1× banner, HB 00–13. P1_3: 0 před/během pulzu, 1 po RST H2 a dál. Storm se nereprodukoval. První obrazy UART garbage (SDCC overlay); finále `--nooverlay`. Detail `docs/experiments/EXP-024.md`. **Další krok není SPI** — nejdřív vyhodnocení.

---

### EXP-20260828-023 — Phase 2 P0_0 PWR only

**Status:** PASS MCU / INCONCLUSIVE napájení CoG a BUSY

Isolated. P0_0 OFF→ON→OFF, BUSY stále 0, MCU žije. `docs/experiments/EXP-023.md`.

---

### EXP-20260828-022 — Phase 1 passive BUSY (isolated)

**Status:** PASS UART/MCU / INCONCLUSIVE identita P1_3=BUSY

**Firmware:** v0.4a. Debugger isolated. `BUSY=0` staticky, 1× banner, `RESET_CAUSE=01`. Detail `docs/experiments/EXP-022.md`.

---

### EXP-20260828-021 — LED register delta OFF / P2_1 / P2_2 / BOTH

**Status:** PASS (UART + registry)

**HYPOTÉZA**

RGB WHITE (P2_1+P2_2) aktivuje i další GPIO jako low-side R-/G-/B-. Delta P0/P1 DIR/SEL to ukáže.

**Vstupní stav**

DEV tag. v0.3k. Debugger isolated (GPIO27 dh, GPIO21 dh). Runtime = GPIO17 ON.

**Jedna hlavní změna**

Firmware jen dumpuje registry; žádný extra GPIO drive. Stavy: OFF → P2_1 → P2_2 → BOTH.

**Očekávaný výsledek**

1× banner. DIR/SEL konstantní kromě P2 bitů 1–2. Pokud RGB WHITE používá další sink GPIO, změní se P0DIR/P1DIR nebo P0/P1 data.

**Skutečný výsledek (OVĚŘENO)**

1× `v0.3k`. Capture `captures/ov26_exp021_por.bin`. Tag po capture OFF.

```text
STATE OFF   P0=FF P1=FF P2=19  P0DIR=00 P1DIR=10 P2DIR=06  P0SEL=00 P1SEL=40 P2SEL=00 PERCFG=02
STATE P2_1  P0=FF P1=FF P2=1B  (DIR/SEL beze změny)
STATE P2_2  P0=FF P1=FF P2=1D  (DIR/SEL beze změny)
STATE BOTH  P0=FF P1=FF P2=1F  (DIR/SEL beze změny)
```

P2: `0x19=P2_0+P2_3+P2_4`, `0x1B=+P2_1`, `0x1D=+P2_2`, `0x1F=oba`. P1DIR bit4 = flash CS (uart1). P1SEL bit6 = UART TX. PERCFG bit1 = USART1 alt2.

**Klasifikace**

PASS. Žádný třetí LED GPIO v registrech. R-/G-/B- nejsou MCU výstupy v tomto stavu.

**ZÁVĚR**

RGB WHITE = jen P2_1+P2_2. Kanály R/G/B z firmwaru nejde vyčíst. Další krok = fyzická kontinuita katod (sdílený sink vs tři FET).

**DALŠÍ KROK**

Jeden měřicí požadavek v `docs/LED_GL340_TRACE.md`. TAG OFF.

---

### EXP-20260828-020 — LED pair ON/OFF control

**Status:** PASS UART / optika čeká potvrzení blikání

**Firmware:** v0.3j — `P2_2=1; P2_1=1` ~4 s, pak obě 0 ~4 s.

---

### EXP-20260828-019 — LED BOOST vs SINK (human)

**Status:** PASS (architektura)

Člověk: RGB (pulz k modru) → přidá se bílá → obě zhasnou. Odpovídá 11 pak 00. Kanály R/G/B/W nemají vlastní GPIO.

---

### EXP-20260828-019 — LED BOOST vs SINK (GL340 architecture)

**Status:** PASS UART / optika čeká člověka

**Firmware:** v0.3i, jen P2_1/P2_2, žádný GPIO sweep.

**Očekávání (HYPOTÉZA common anode + boost):** 00 tma, 10 tma, 01 tma, 11 RGB pak bílá.

**UART:** 1× `v0.3i`, stavy ON/BOOST. Tag ON.

---

### EXP-20260828-018 — named RGB vs WHITE (isolate white washout)

**Status:** PASS UART / optika čeká člověka

**Hypotéza**

P2_1=1 P2_2=0 = RGB bez bílé. P2_2=1 = bílá. Obě naráz bílá přezáří RGB.

**Skutečný UART**

1× `v0.3h`, `RGB  P2_1=1 P2_2=0`, `WHITE P2_1=0 P2_2=1`. Tag ON.

---

### EXP-20260828-017 — slow P2 LED states (white vs RGB)

**Status:** PASS UART (fixed overlay) / LED map čeká člověka

**Firmware / commit:**

```text
v0.3g_led_slow 901 B
~5 s hold, ~2 s OFF mezi stavy
```

**Hypotéza**

v0.3f vypadalo jako blikání bílé, protože 2 s je moc rychlé. Pomalý cyklus rozliší 00/10/01/11. RGB možná potřebuje jiný pin nebo PWM — HYPOTÉZA.

**Vstupní stav**

Člověk: 2 LED (bílá + RGB). v0.3f = zapínání/vypínání bílé.

**Jedna hlavní změna**

Delší hold + OFF mezery. První build s `delay_n` overlay = UART garbage. Reflash bez vnořené smyčky.

**Skutečný UART**

1× `v0.3g LED SLOW`, pak OFF / 00 / 10 / 01. Tag nechán ON.

**Klasifikace**

PASS MCU. Optika: čeká report.

**Další krok**

Člověk: u každého 5s stavu bílá on/off a RGB on/off/barva.

---

### EXP-20260828-016 — v0.3f LED P2_1/P2_2, debugger isolated

**Status:** PASS (UART/MCU) / LED barva čeká na člověka

**Firmware / commit:**

```text
v0.3f_led_p2 889 B verify OK
runtime GPIO27+21 off
```

**Hypotéza**

P2_1/P2_2 jako GPIO bez debuggeru je stabilní (žádný P2_0). UART vypíše stavy po ~2 s. LED na desce zareagují — barvy ověří člověk.

**Vstupní stav**

v0.3a, attach funguje.

**Jedna hlavní změna**

Jen P2SEL/P2DIR bity 1+2 a cyklus 00/10/01/11. Žádný P2_0, P2_3/P2_4, EPD, WDT.

**Očekávaný výsledek**

1× banner `v0.3f LED P2 TEST`, stavy na UART, žádný storm.

**Skutečný UART**

20 s: 1 banner, RESET_CAUSE=01, 3× `00`, 3× `10`, 2× `01`, 2× `11`. Žádný v0.3a text.

**Klasifikace**

PASS na stabilitu. LED optika: čeká report.

**Závěr**

Budit P2_1/P2_2 bez debuggeru MCU nespadne. Mapování bílá/RGB je HYPOTÉZA, dokud člověk nepřiřadí barvy ke stavům.

**Další krok**

Lidský popis LED pro 00 / 10 / 01 / 11. Tag nechán ON.

---

### EXP-20260828-015 — flash v0.3a přes attach

**Status:** PASS

**Firmware / commit:**

```text
v0.3a_uart_baseline erase+write+verify
GPIO17/27/21 attach, then isolated POR UART
```

**Hypotéza**

Automatický `attach` + `cc-tool -e -w -v` na DEV projde. Po odříznutí debugu GPIO17 POR dá jeden banner jako EXP-011.

**Vstupní stav**

Idle. Hex na Pi. DEV, ne stock.

**Jedna hlavní změna**

Celý flash workflow bez ručního USB.

**Očekávaný výsledek**

Verify OK. UART 1× banner, heartbeat, žádný storm.

**Skutečný výsledek**

Identify CC2510. Erase completed. Write 843 B, 0.63 s. Verify completed 0.46 s.

POR 15 s, debug isolated: 84 B, **1 banner**, `RESET_CAUSE=1 EXTERNAL_RESET_N`, 14 teček.

**Klasifikace**

PASS

**Závěr**

Ovládání tag + debug linky + USB 5 V je **OVĚŘENO** včetně flashe. Runtime UART bez debuggeru stabilní.

**Další krok**

EPD passive na novém DEV (v0.3c) s GPIO27+21 off.

---

### EXP-20260828-014 — GPIO21 USB +5 V + attach → CC2510

**Status:** PASS

**Firmware / commit:**

```text
v0.3a, no reflash
GPIO21 = debugger USB +5 V (human)
```

**Hypotéza**

GPIO21 `dh` USB pryč, `dl` enumerace `0451:16a2`. `attach` (17+27 ON, pak 21 cyklus) → `cc-tool -t` uvidí CC2510 bez ručního USB.

**Vstupní stav**

Idle 17/27/21 `dh`.

**Jedna hlavní změna**

Nový pin GPIO21 ve `ov26-relays.sh`. Žádný flash.

**Očekávaný výsledek**

Phase A: USB absent / present / absent. Phase B: CC2510.

**Skutečný výsledek**

```text
IDLE_USB=absent
usb-on → USB at 1s
usb-off → USB absent at 1s
attach → USB at 1s, Target: CC2510 ID 0x2510
```

Druhý USB cyklus nebyl potřeba. Konec idle všech tří pinů.

**Klasifikace**

PASS

**Závěr**

Automatické ovládání tag 3 V + debug linek + USB debuggeru je OVĚŘENO. Flash workflow má jít přes `ov26-relays.sh attach`.

**Další krok**

Runtime UART s GPIO27/21 off. EPD žebřík na novém DEV bez debuggeru na sběrnici.

---

### EXP-20260827-013 — cc-tool -t after debug path to tag

**Status:** FAIL (no target) / PASS (USB stayed with both coil groups)

**Firmware / commit:**

```text
v0.3a, no reflash
human: DD/DC/RESET průchozí relé → deska tagu, USB debugger znovu v USB, červená LED
```

**Hypotéza**

GPIO17 ON + GPIO27 ON (NO, active-low) → `cc-tool -t` uvidí CC2510.

**Vstupní stav**

Idle: USB `0451:16a2` přítomné. Polarita GPIO27 OVĚŘENA vizuálem (LOW = 3 LED + kontakty spojené).

**Jedna hlavní změna**

Jen identify, žádný flash. USB kontrola po dbg-on i po tag-on.

**Očekávaný výsledek**

Name CC2510, ID 0x2510.

**Skutečný výsledek**

USB zůstalo po 3 cívkách i po tag+debug. `Programmer: CC Debugger` / `No target detected`. EXP-013a bez USB v portu byl `device not found` (debugger fyzicky odpojen).

**Klasifikace**

FAIL na target. PASS na USB enumeraci při obou relé ON (tentokrát bez 5V sag).

**Závěr**

Cesta k desce tagu a polarita relé nestačí. Debugger čip na debug busu nevidí. Další: 3 V na DVDD při GPIO17 ON, nebo DD/DC prohozené / RESET na špatný net.

**Další krok**

Lidské měření DVDD na tagu při GPIO17 ON, nebo kontrola pinů debuggeru 3/4/7.

---

### EXP-20260827-012 — GPIO27 ganged RESET/DD/DC

**Status:** FAIL (debug bus) / PASS (USB stays) / diagnosticky cenné

**Firmware / commit:**

```text
v0.3a, no reflash
human: GPIO27 → 3 relé RESET_N+DD+DC; USB 5V debuggeru nespínané
```

**Hypotéza**

GPIO27 `dh` odřízne RESET/DD/DC → GPIO17 POR jako EXP-011 (1 banner + tečky). GPIO27 `dl` spojí linky → `cc-tool -t` uvidí CC2510. USB `0451:16a2` zůstane i při `dh`.

**Vstupní stav**

Obě GPIO `op dh`. USB debugger i CP2102 přítomné.

**Jedna hlavní změna**

Nové fyzické zapojení GPIO27. Žádný reflash.

**Očekávaný výsledek**

A: 1× banner, heartbeat, žádný loop. B: Name CC2510.

**Skutečný UART / pozorování**

Phase 0: USB debugger při GPIO27 `dh` **přítomný** — 5V vyhybka je pryč. OVĚŘENO.

Phase A (GPIO27 `dh`, GPIO17 POR 15 s): 15 B, **15 teček, 0 bannerů**. Žádný reset storm.

Idle / tag-off (GPIO17 `dh`): **8 teček / 8 s** (`........`). MCU běží bez tag 3V relé. OVĚŘENO.

Phase B (GPIO27 `dl`, tag ON): `Programmer: CC Debugger` / `No target detected`.

Phase B polarita (GPIO27 `dh`, tag ON): stejné, žádný CC2510. Nejsou to NC kontakty.

**Klasifikace**

FAIL na debug cestě k MCU. PASS na „USB zůstává“. INCONCLUSIVE na izolaci RESET (storm není, ale RESET k debuggeru zjevně nedorazí).

**Závěr**

Automatické odpojení debug linek **zatím nefunguje jako programovací cesta**. MCU má UART heartbeat i s GPIO17 off — vypínač tagu teď nestačí. Dokud `cc-tool -t` neuvidí CC2510, neflashovat.

**Další krok**

Lidská kontrola: je debug kabel na tagu přes ta 3 relé? Cvaknou při `dbg-on`? DVDD sense a GND trvale? Baterie v tagu?

---

### EXP-20260827-011 — true POR v0.3a, debug cable off tag

**Status:** PASS

**Firmware / commit:**

```text
v0.3a, no reflash
human: debugger wires disconnected from tag
GPIO27 off, GPIO17 POR, 20 s UART
```

**Hypotéza**

EXP-010 smyčka byla z RESET_N přes připojený (i nevypnutý) debugger. Bez kabelu jeden boot a heartbeat.

**Vstupní stav**

Tag OFF ticho. Debugger USB absent.

**Jedna hlavní změna**

Fyzicky pryč DD/DC/RESET/DVDD. Jinak stejné jako EXP-010.

**Očekávaný výsledek**

Jeden banner, tečky, žádný loop.

**Skutečný UART / pozorování**

Tag OFF: 1 B. TAG ON 20 s, 89 B:

```text
OpenVusion GU140 RESET CAUSE TEST
RESET_CAUSE=1 EXTERNAL_RESET_N
...................
```

1 banner, 19 teček, 0 opakování. `EXTERNAL_RESET_N` místo POR: pravděpodobně RC na RESET_N při náběhu 3V (ne debugger).

**Klasifikace**

PASS

**Závěr**

v0.3a bez debuggeru je **stabilní**. EXP-010 storm = debug kabel na RESET_N. Baseline MCU+UART na novém DEV je OVĚŘENO.

**Další krok**

GPIO mapa / EPD po vrstvách. Debugger k tagu jen na flash, ne na runtime UART testy.

---

### EXP-20260827-010 — true POR v0.3a, debugger 5V off

**Status:** FAIL (reset storm) — diagnosticky cenné

**Firmware / commit:**

```text
v0.3a_uart_baseline, no reflash
GPIO27 dh (debugger USB 5V off), GPIO17 power cycle
```

**Hypotéza**

Bez debugger 5V a bez P2_0 drive dá true POR jeden banner `RESET_CAUSE=0 POR/BROWNOUT` a tečky.

**Vstupní stav**

Nový DEV, UART OVĚŘENO. Relé NO. Tag off = 1× `0x00` (napájení se řeže, baterie neběží).

**Jedna hlavní změna**

GPIO27 off po celou dobu. Žádný cc-tool. Jen GPIO17 OFF→ON.

**Očekávaný výsledek**

Jeden POR banner, heartbeat, žádný loop.

**Skutečný UART / pozorování**

Tag OFF 5 s: 1 B `0x00`. Debugger USB pryč.

TAG ON 20 s: **53298 B, 708× banner, 707× `RESET_CAUSE=1 EXTERNAL_RESET_N`, 0× POR, 0× WDT, ~28 ms/boot.** Vzor: banner + jedna tečka + hned reset.

**Klasifikace**

FAIL

**Závěr**

Není to brownout z P2_0 (v0.3a P2_0 nebudí). Reset příčina je **RESET_N pin**. GPIO27 řeže jen USB 5V; debug vodiče (včetně RESET_N) na tagu nejspíš zůstaly. Nevypnutý/nenapájený debugger na RESET_N je silná HYPOTÉZA.

**Další krok**

Fyzicky odpojit CC Debugger od tagu (nechat CP2102). Pak znovu jen GPIO17 POR.

---

### EXP-20260827-009 — UART after P1_6 rewired on new DEV

**Status:** PASS

**Firmware / commit:**

```text
v0.3a already in flash (no reflash)
```

**Hypotéza**

Po správném P1_6 → CP2102 RXD uvidíme banner a heartbeat.

**Vstupní stav**

Nový DEV odemčený, v0.3a, člověk opravil UART pin. GND společná.

**Jedna hlavní změna**

Jen zapojení P1_6. Relé 2 pak 1, `cc-tool --reset`, 15 s UART.

**Očekávaný výsledek**

`RESET CAUSE TEST` + tečky.

**Skutečný UART / pozorování**

```text
OpenVusion GU140 RESET CAUSE TEST
RESET_CAUSE=1 EXTERNAL_RESET_N
.
OpenVusion GU140 RESET CAUSE TEST
RESET_CAUSE=1 EXTERNAL_RESET_N
..............
```

2 bannery z debugger resetu (jako dřív), pak 14 teček, žádný POR loop v okně.

**Klasifikace**

PASS

**Závěr**

Nový DEV + v0.3a + UART na P1_6 je OVĚŘENO. MCU běží.

**Další krok**

True POR bez debuggeru (GPIO27 off, cyklus GPIO17), nebo dál baseline.

---

### EXP-20260827-008 — sacrifice new locked tag, flash v0.3a

**Status:** PASS (erase/unlock/write/verify) / INCONCLUSIVE (UART)

**Firmware / commit:**

```text
v0.3a_uart_baseline 843 B
human: explicit YES to erase/sacrifice this unit
```

**Hypotéza**

Locked stock CC2510 jde odemknout mass erase a naběhne náš UART-only FW.

**Vstupní stav**

Nový tag, `Target is locked`. Relé 1+2, UART CP2102 přítomen.

**Jedna hlavní změna**

`cc-tool -v read -e -w v0.3a_uart_baseline.hex` (žádný lock po zápisu).

**Očekávaný výsledek**

Verify OK, lock pryč, UART banner + tečky.

**Skutečný UART / pozorování**

Erase+write+verify dokončeno. Po flashi `cc-tool -t`: CC2510 ID `0x2510`, **už není locked**.

UART 15 s po flashi: 0 B. `cc-tool --reset` + 12 s: 3× `0x00`, žádný banner.

**Klasifikace**

PASS programování. INCONCLUSIVE UART (P1_6 na tomto kusu pravděpodobně není na CP2102, nebo TX nejde ven).

**Závěr**

Tenhle kus je nový DEV: odemčený, v0.3a ve flashi, debug žije. Diagnostický UART zatím nepotvrzený.

**Další krok**

Ověřit fyzicky P1_6 → CP2102 RXD. Pokud sedí a UART pořád ticho, pak firmware/clock na tomto kusu.

---

### EXP-20260827-007 — reflash UART-only v0.3a after debugger return

**Status:** PASS

**Firmware / commit:**

```text
v0.3a_uart_baseline rebuilt and flashed
no P2_0 / P0_0 drive
```

**Hypotéza**

Debugger znovu programuje DEV tag. UART-only image nahradí nebezpečné v0.3e a s debuggerem dá jeden banner + heartbeat.

**Vstupní stav**

Debugger USB+wiring zpět. `cc-tool -t` vidí CC2510 `0x2510`. Relé bylo OFF, target ale viditelný (parazitní napájení).

**Jedna hlavní změna**

Erase+write+verify v0.3a místo v0.3e.

**Postup**

```text
TAG ON, build_one.sh v0.3a, hil-capture-through-flash 20s
```

**Očekávaný výsledek**

Verify OK. Jeden `RESET CAUSE TEST`, potom tečky. Reset po flashi = EXTERNAL_RESET_N.

**Skutečný UART / pozorování**

```text
(leftover v0.3e) OFF/RST1 BUSY=0 / POWER ON
OpenVusion GU140 RESET CAUSE TEST
RESET_CAUSE=1 EXTERNAL_RESET_N
.................   (17 dots, no second banner)
```

**Klasifikace**

PASS

**Závěr**

Debugger zapisuje a verifikuje. v0.3a s debuggerem je stabilní. True POR bez debuggeru na v0.3a ještě není.

**Další krok**

Odpojit debugger, true POR v0.3a (jeden banner + tečky, RESET_CAUSE=0 očekávaný na power-on).

---

### EXP-20260827-006 — true POR without CC Debugger (v0.3e)

**Status:** PASS (relay really cuts power) / FAIL (v0.3e reset storm after P2_0 high)

**Firmware / commit:**

```text
v0.3e_reset_probe still in flash (cannot reflash without debugger)
human confirmed debugger disconnected
cc-tool: CC Debugger device not found
```

**Hypotéza**

Bez debuggeru GPIO17 relé provede skutečný power cut/POR. v0.3e po true POR buď jednou doběhne k DONE, nebo se projeví dříve maskovaný brownout.

**Vstupní stav**

Debugger odpojen (člověk). UART CP2102 RXD+GND ponechán. Poslední flash: v0.3e.

**Jedna hlavní změna**

Žádná změna firmware. Jen true power-cycle přes relé, bez `cc-tool`.

**Postup**

```text
TAG OFF 8s listen
bounded POR capture 30s (arm UART, TAG ON, then TAG OFF)
```

**Očekávaný výsledek**

TAG OFF: žádný heartbeat. TAG ON: jeden v0.3e banner a buď DONE, nebo opakovaný POR.

**Skutečný UART / pozorování**

TAG OFF 8 s:

```text
1 byte 0x00, žádné tečky, žádný banner
```

True POR 30 s:

```text
BYTES=105243
RESET PROBE START  1714x
OFF/RST0 BUSY=1    seen
OFF/RST1           0x
POWER ON           0x
DONE               0x
~17.5 ms na jeden restart (~57 Hz)
```

Firmware vždy stihne clock+UART+banner+`OFF/RST0 BUSY=1` a spadne při `EPD_RESET=1` (P2_0 0→1), dřív než `delay_crude()` a `OFF/RST1`.

Se stejnou binárkou a připojeným debuggerem (EXP-005) sekvence doběhla k DONE.

**Klasifikace**

PASS: relé bez debuggeru **opravdu vypíná/zapíná**.
FAIL: v0.3e bez debuggeru není stabilní — reset smyčka vázaná na P2_0 high.

**Závěr**

Parazitní napájení z debuggeru maskovalo brownout. True POR je teď použitelný. Na tagu nesmí zůstat v0.3e pod napětím — 57 Hz reset storm. Další flash až po opětovném připojení debuggeru: nejdřív UART-only (žádný P2_0 drive), teprve pak izolovat P2_0.

**Další krok**

Odpoledne: připojit debugger, TAG ON, flash v0.3a (nebo nový UART-only bez P2_0), ověřit, odpojit debugger, true POR znovu.

---

### EXP-20260827-005 — v0.3e EPD reset probe (P2_0 H/L/H)

**Status:** PASS (MCU stable) / INCONCLUSIVE (BUSY polarity/identity)

**Firmware / commit:**

```text
v0.3e_reset_probe
26 MHz XOSC, USART1 Alt2 115200 on P1_6
P0_0 EPD_PWR candidate, P0_1 CS=1, P2_0 RESET H/L/H, P1_3 sampled
```

**Hypotéza**

Hardware reset na kandidátu P2_0 po zapnutí P0_0 je bezpečný a může změnit P1_3.

**Vstupní stav**

EXP-004 dokončen bez MCU reset smyčky. Debugger připojen, TAG ON.

**Jedna hlavní změna**

K existujícímu power-only se přidá P2_0 reset sekvence H/L/H.

**Postup**

```text
build_one.sh v0.3e_reset_probe
hil-capture-through-flash.sh 30s
idle 15s after DONE
```

**Očekávaný výsledek**

Jeden banner, dokončená sekvence, žádný opakovaný boot. BUSY se po resetu může zvednout (Pervasive: ready = HIGH).

**Skutečný UART / pozorování**

```text
OpenVusion GU140 v0.3e RESET PROBE START
OFF/RST0 BUSY=1
OFF/RST1 BUSY=0
POWER ON
ON/pre-reset BUSY=0
RESET H/L/H NOW
sample 0..11 BUSY=0
DONE / safe shutdown
```

Idle 15 s po DONE: 0 bajtů, žádný další banner.

Na začátku capture zbytek `POWER ON NOW` z předchozího v0.3d (překryv relé/flash).

**Klasifikace**

PASS pro stabilitu MCU.
INCONCLUSIVE pro „P1_3 = EPD BUSY“: P1_3 klesne 1→0 už při P2_0=1 a vypnutém P0_0 (`OFF/RST1`), a po H/L/H zůstane 0. To není chování ready=HIGH z Pervasive referenčního driveru.

**Závěr**

P2_0 lze bezpečně togglovat. P1_3 je elektricky ovlivněn P2_0 i když je kandidát EPD power ve stavu OFF. Mapu BUSY/RESET/POWER zatím nepovyšovat na OVĚŘENO.

**Další krok**

Neprovádět CoG/SPI/refresh. Izolovat vazbu P2_0↔P1_3, nebo ověřit polaritu P0_0 (zda „OFF“ opravdu odpojí panel). Volitelně true POR bez debuggeru.

---

### EXP-20260827-004 — v0.3d EPD power-only (P0_0)

**Status:** PASS

**Firmware / commit:**

```text
v0.3d_power_only
26 MHz XOSC, no SPI, no P2_0 reset
```

**Hypotéza**

Řízení pouze kandidátu P0_0 (EPD power) nezpůsobí reset smyčku. P1_3 se může změnit s napájením panelu.

**Vstupní stav**

v0.3c idle tichý, BUSY staticky 0. Debugger připojen, TAG ON.

**Jedna hlavní změna**

P0_0 jako výstup: 1 = presumed OFF, 0 = presumed ON. 12 vzorků P1_3.

**Postup**

```text
build_one.sh v0.3d_power_only
hil-capture-through-flash.sh 30s
```

**Očekávaný výsledek**

Jeden banner, sekvence doběhne k `DONE`. Pokud se banner opakuje hned po `POWER ON NOW`, STOP.

**Skutečný UART / pozorování**

```text
OpenVusion GU140 v0.3d POWER ONLY START
PWR OFF BUSY=1
POWER ON NOW
sample 0..11 BUSY=0
POWER OFF NOW
DONE
```

Jeden start, žádný opakovaný boot v okně capture.

**Klasifikace**

PASS

**Závěr**

P0_0 lze v tomto zapojení bezpečně budit. P1_3=1 při P0_0=1 a P1_3=0 při P0_0=0. To je konzistentní s active-low power + nějakým efektem na P1_3, ale není to důkaz identity EPD power/BUSY.

**Další krok**

Reset probe v0.3e.

---

### EXP-20260827-003 — v0.3c passive P1_3 BUSY candidate

**Status:** PASS (observation) / INCONCLUSIVE (BUSY identity)

**Firmware / commit:**

```text
v0.3c_busy_passive
26 MHz XOSC, P1_3 high-Z input, no EPD drive
```

**Hypotéza**

Pasivní čtení P1_3 je bezpečné a ukáže statickou nebo měnící se hodnotu bez MCU resetu.

**Vstupní stav**

13 MHz i 26 MHz idle heartbeat byly stabilní při debuggeru + TAG ON.

**Jedna hlavní změna**

Pouze čtení P1_3 (P1INP tristate), žádný EPD výstup.

**Postup**

```text
build_one.sh v0.3c_busy_passive
hil-capture-through-flash.sh 25s
idle 15s without reflash
```

**Očekávaný výsledek**

Jeden banner `PASSIVE BUSY START` a `BUSY=0` nebo `BUSY=1`. Žádné opakované bannery.

**Skutečný UART / pozorování**

Capture během flashe:

```text
OpenVusion GU140 v0.3c PASSIVE BUSY START
BUSY=1
BUSY CHANGED -> 0
```

Idle 15 s potom: 0 bajtů (firmware tiskne jen změny), žádný další banner.

**Klasifikace**

PASS jako pasivní GPIO experiment.
INCONCLUSIVE jako potvrzení BUSY pinu (`P1_3==1` samo o sobě nestačí; viděli jsme 1→0 po startu).

**Závěr**

P1_3 je čitelný. Po bootu 1→0 a dál 0. MCU se neresetuje. Identita BUSY zůstává HYPOTÉZA.

**Další krok**

Power-only v0.3d.

---

### EXP-20260827-002 — 13 MHz HS-RCOSC vs 26 MHz XOSC

**Status:** PASS (stability A/B) / FAIL (13 MHz UART accuracy after debugger reset)

**Firmware / commit:**

```text
v0.3b_hsrc_13mhz
clock_init_hsrc_13mhz(), UART BAUD_E=13 / BAUD_M=34
no XOSC start
```

**Hypotéza**

Pokud 26 MHz XOSC způsobuje brownout/reset, reset-default HS-RCOSC ~13 MHz bude stabilnější.

**Vstupní stav**

EXP-001: 26 MHz idle tečky bez banneru (MCU nepřerušil běh). Debugger připojen, TAG ON.

**Jedna hlavní změna**

Nepřepínat na 26 MHz XOSC. CLKSPD=000, OSC=1 (HS RCOSC). UART přepočítán na nominálních 13 MHz / 115200.

**Postup**

```text
flash v0.3b, idle 15s, cc-tool --reset capture 15s, idle soak 30s
```

**Očekávaný výsledek**

Stejná observabilita 115200. Méně nebo stejně resetů jako 26 MHz.

**Skutečný UART / pozorování**

Idle po flash (15 s): 6 čistých teček, 0 bannerů.
Idle soak (30 s): 14 čistých teček, 0 bannerů (~2.1 s/tečka, cca polovina 26 MHz delay).

Po `cc-tool --reset`: dva poškozené bannery, čitelné fragmenty `CLOCK=13MHZ_HSRC`, `RESET_CAUSE=1 EXTERNAL_RESET_N`, pak 7 čistých teček. Dlouhé řetězce mají bitové chyby (HSRC není krystal).

**Klasifikace**

PASS: 13 MHz idle je stejně stabilní jako 26 MHz (žádný spontánní POR při debuggeru + TAG ON).
FAIL jako UART telemetrie: streamovaný text po debugger resetu není spolehlivě 115200.

**Závěr**

XOSC vs HS-RCOSC v této lab konfiguraci nespouští POR smyčku. Původní `RESET_CAUSE=0 POR/BROWNOUT` se zde neopakoval. HSRC UART je mimo toleranci pro dlouhé bannery — očekávané, dokud není RCOSC kalibrovaný.

**Další krok**

Pasivní GPIO (v0.3c), protože baseline v aktuálním zapojení drží.

---

### EXP-20260827-001 — 26 MHz XOSC baseline + relay/debugger chování

**Status:** PASS (idle stability) + OVĚŘENO parasitic power / debugger reset cause

**Firmware / commit:**

```text
existing v0.3a_uart_baseline.hex (746 B)
clock_init_26mhz(), UART 115200 @ 26 MHz
```

**Hypotéza**

Současný 26 MHz firmware se po power-on opakovaně restartuje s `RESET_CAUSE=0 POR/BROWNOUT`.

**Vstupní stav**

cc-tool vidí CC2510 ID 0x2510. GPIO17 lo = TAG ON. Debugger připojen (pin 9 3V3 nepřipojen).

**Jedna hlavní změna**

Flash nezměněného v0.3a a bounded UART capture kolem relé power-cycle a později `cc-tool --reset`.

**Postup**

```text
flash + relay OFF/ON capture 15s
repeat power-cycle capture 20s with 1.5s UART arming
TAG OFF UART continue test
cc-tool --reset capture 12s
```

**Očekávaný výsledek**

Opakované `RESET_CAUSE=0 POR/BROWNOUT` a fragmentované bannery.

**Skutečný UART / pozorování**

Relay power-cycle: pouze tečky (14/15 s, 20/20 s), žádný banner.

TAG OFF (GPIO17 hi): tečky pokračují (MCU běží dál).

`cc-tool --reset`:

```text
OpenVusion GU140 RESET CAUSE TEST
RESET_CAUSE=1 EXTERNAL_RESET_N
```

opakovaně 3× v 12 s s fragmenty uprostřed (debugger reset, ne POR).

**Klasifikace**

FAIL vůči původní hypotéze POR smyčky v tomto zapojení.
PASS jako diagnostika: idle firmware je stabilní; relé při připojeném debuggeru MCU nevypne; debugger reset = `EXTERNAL_RESET_N`.

**Závěr**

1. GPIO17 relé **neprovádí hard POR**, dokud je CC Debugger připojený — OVĚŘENO parazitní napájení MCU.
2. Spontánní POR/BROWNOUT se při debuggeru + TAG ON neopakuje.
3. `cc-tool --reset` je platný stimulus a správně čte SLEEP.RST=1.

**Další krok**

A/B 13 MHz (EXP-002). True POR vyžaduje odpojení debuggeru člověkem.

---

## Template

### EXP-YYYYMMDD-NNN — short title

**Status:** PLANNED / RUNNING / PASS / FAIL / INCONCLUSIVE

**Firmware / commit:**

```text
...
```

**Hypotéza**

...

**Vstupní stav**

...

**Jedna hlavní změna**

...

**Postup**

```text
...
```

**Očekávaný výsledek**

...

**Skutečný UART / pozorování**

```text
...
```

**Klasifikace**

PASS / FAIL / INCONCLUSIVE

**Závěr**

...

**Další krok**

...

---

## Known previous experiment — reset cause baseline

**Status:** FAIL diagnostically useful (před touto session)

**OVĚŘENO tehdy:**

Opakovaný výstup:

```text
OpenVusion GU140 RESET CAUSE TEST
RESET_CAUSE=0 POR/BROWNOUT
```

V session 2026-08-27 se toto při připojeném debuggeru a TAG ON **nepodařilo reprodukovat**. Viz EXP-001.
