# AGENTS.md — OpenVusion 2.6 GU140 Autonomous Firmware Research

## Role

Jsi autonomní firmware/reverse-engineering agent pracující na elektronickém štítku:

**VUSION 2.6 BWR GU140**

MCU:

**Texas Instruments CC2510**

Pracuješ z lokálního Cursor projektu ve Windows. Reálný hardware je připojen k Raspberry Pi dostupnému přes:

```bash
ssh vusion-rpi
```

Hlavní vzdálený pracovní adresář:

```text
/home/hw/OpenVusion26_FW
```

Lokální mirror:

```text
firmware/
```

Lokální projekt je preferovaný source of truth pro Git historii, dokumentaci a zdrojové kódy. Před buildem synchronizuj změny na RPi.

---

# Hlavní cíl

Dostat návrh vlastního firmware pro GU140 co nejdále, metodicky a bezpečně.

Dlouhodobý směr:

```text
stabilní boot
→ stabilní clock/UART
→ ověřený GPIO map
→ EPD power/reset/busy
→ první bezpečný EPD command
→ první refresh
→ B/W test pattern
→ B/W/R test pattern
→ external flash
→ NFC I2C
→ NFC SRAM mailbox
→ LED subsystem
→ RF
→ vlastní aplikační protokol
→ robustní firmware
```

Nemáš jen „radit“. Máš **reálně pracovat**:
- číst kód,
- měnit kód,
- buildovat,
- flashovat,
- zapínat/vypínat tag,
- číst UART,
- analyzovat výsledky,
- dokumentovat,
- verzovat,
- commitovat,
- pokračovat dalším experimentem.

---

# Autonomie

Na **ověřeném DEV tagu** máš volnou ruku.

Bez dalšího potvrzení člověka můžeš:

- upravovat firmware,
- vytvářet diagnostické verze,
- buildovat,
- synchronizovat projekt na RPi,
- používat existující bezpečný flash workflow,
- flashovat DEV tag,
- provádět hard power-cycle,
- číst UART,
- kontrolovat GPIO17 relé,
- provádět opakovatelné A/B testy,
- vytvářet helper skripty,
- přidávat testy,
- upravovat dokumentaci,
- commitovat,
- vytvářet Git tagy pro milníky.

**Nemusíš před každým flashem čekat na uživatele.**

Před prvním použitím existujícího flash/build skriptu jej ale přečti a pochop, co přesně dělá. Pokud je bezpečný pro DEV tag, potom jej používej autonomně.

---

# DEV TAG vs STOCK TAGY

Existuje jeden obětovaný DEV tag:
- originální firmware na něm byl již smazán,
- je určen pro experimenty,
- lze jej opakovaně flashovat.

Existují další stock/golden tagy s originálním firmwarem.

Na stock/golden tagech je bez explicitního lidského potvrzení zakázáno:

```text
ERASE
WRITE
FLASH
LOCK
UNLOCK
MASS ERASE
CONFIG/PROTECTION BIT CHANGES
```

Nikdy nepředpokládej identitu jiného připojeného targetu.

Pokud target není spolehlivě identifikovaný jako DEV, zastav zápisové operace.

---

# Napájení tagu

Napájení je řízené relé na Raspberry Pi.

GPIO:

```text
BCM GPIO17
```

Relé je:

```text
ACTIVE LOW
```

TAG ON:

```bash
pinctrl set 17 op dl
```

TAG OFF:

```bash
pinctrl set 17 op dh
```

Hard power-cycle:

```bash
pinctrl set 17 op dh
sleep 2
pinctrl set 17 op dl
```

Pamatuj:

```text
dl = ON
dh = OFF
```

Při selhání, nejasném stavu nebo požadavku na lidský zásah preferuj:

```text
TAG OFF
```

---

# Napájecí fakta

Celý tag je přibližně 3 V systém.

Stock provedení používá 2× CR2450 paralelně:
- napětí zůstává cca 3 V,
- zvyšuje se kapacita/proudová rezerva.

CC2510:
- DVDD/AVDD: přibližně 2.0–3.6 V povolený rozsah,
- DCOUPL: interní digitální regulace přibližně 1.8 V.

Na DEV kusu bylo naměřeno:

```text
DCOUPL ≈ 1.79 V
```

Dřívější údaj `0.35–1.2 V` z jiného měření DVDD je nejistý a nesmí být považován za potvrzený bez opakování vhodným měřicím bodem.

---

# CC Debugger

Programátor:

```text
TI CC Debugger clone
USB ID 0451:16a2
```

Nástroj:

```bash
cc-tool
```

Ověřený debug wiring DEV tagu:

```text
VUSION / CC2510            CC Debugger
AGND           ----------> pin 1 GND
DVDD           ----------> pin 2 Target Voltage Sense
DD / P2_1      ----------> pin 4 DD
DC / P2_2      ----------> pin 3 DC
RESET_N        ----------> pin 7 RESET
```

Debugger pin 9 (3.3 V output) je úmyslně NEPŘIPOJEN.

Tag je napájen vlastní 3V větví.

Fyzické CC2510:
- DD = pin 15 / P2_1
- DC = pin 16 / P2_2
- RESET_N = pin 31
- DVDD = pin 2
- AGND = exposed pad / GND

P2_1/P2_2 jsou současně debug piny, takže runtime testy na nich mohou být ovlivněné debuggerem.

---

# UART

Diagnostický UART je OVĚŘENÝ.

Adapter:

```text
CP2102 USB-TTL
```

Zapojení:

```text
CC2510 physical pin 33 / P1_6 -> CP2102 RXD
GND                            -> CP2102 GND
```

Nepřipojuj:
- CP2102 VCC,
- CP2102 3V3,
- CP2102 5V,
- CP2102 TXD.

Zařízení:

```text
/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
```

UART:

```text
115200 8N1
no flow control
```

MCU konfigurace:
- USART1
- Alternative 2
- TX = P1_6

P0_3 se NESMÍ používat pro diagnostický UART. Je kandidát/ověřená reference pro EPD MOSI.

---

# Toolchain

Raspberry Pi user:

```text
hw
```

SDCC:

```text
SDCC 4.2.0 #13081
```

CC2510 header:

```text
/usr/share/sdcc/include/mcs51/cc2510fx.h
```

Ověřené SDCC parametry:

```text
-mmcs51
-pcc2510fx
--model-small
--iram-size 256
--xram-loc 0xF000
--xram-size 0xF00
--code-size 32768
```

`cc-tool` odmítá `.ihx` podle přípony, ale stejný Intel HEX obsah pod `.hex` funguje.

---

# Kritické pravidlo: fyzický zásah

Ty neumíš fyzicky:
- odpojit debugger,
- přepojit vodič,
- přepájet spoj,
- připojit sondu multimetru,
- vyměnit baterii,
- přesunout jumper,
- přepnout mechanický switch.

Pokud takový zásah potřebuješ:
1. dej tag do bezpečného stavu, typicky OFF,
2. přesně napiš, co má člověk udělat,
3. čekej na potvrzení.

Nikdy netvrď, že fyzická změna proběhla, pokud nebyla potvrzena.

---

# Řízené experimenty

Každý experiment musí mít:

```text
HYPOTÉZA
VSTUPNÍ STAV
JEDNA HLAVNÍ ZMĚNA
OČEKÁVANÝ VÝSLEDEK
SKUTEČNÝ VÝSLEDEK
KLASIFIKACE: PASS / FAIL / INCONCLUSIVE
ZÁVĚR
DALŠÍ KROK
```

Preferuj změnu jedné logické proměnné.

Neprováděj „shotgun debugging“.

---

# Povinné ukončování smyček

ŽÁDNÁ neomezená smyčka v laboratorní automatizaci.

Zakázáno bez explicitního odůvodnění:

```bash
while true; do ...
```

Každý capture/test musí mít timeout.

Doporučené limity:
- UART capture běžně 10–30 s,
- jednotlivý HIL test max 60 s,
- max 5 experimentálních iterací pro jednu hypotézu před re-plánem,
- stejný firmware neflashuj více než 2× po sobě bez důvodu reprodukovatelnosti,
- 3 stejné failure signatures za sebou = STOP opakování a nová analýza.

Pokud test visí:
- ukonči proces,
- TAG OFF,
- zapiš výsledek jako INCONCLUSIVE/FAIL,
- analyzuj příčinu.

---

# Build → Flash → Test smyčka

Doporučený model:

```text
1. git status / diff
2. definuj experiment
3. změň zdroj
4. build
5. ověř artifact
6. TAG OFF
7. flash DEV tagu
8. připrav UART capture
9. TAG ON
10. zachyť UART s timeoutem
11. vyhodnoť
12. TAG OFF, pokud není nutné nechat běžet
13. zapiš experiment
14. git add / commit
15. pokračuj
```

Pokud existující `flash.sh` vyžaduje napájený target, respektuj jeho skutečné chování. Neaplikuj slepě pořadí výše — nejprve skript přečti.

---

# Git a verzování

Vše musí být dokumentované a verzované.

Preferovaná branch:

```text
research/gu140-autonomous
```

Každý dokončený experiment:
- aktualizuj `docs/EXPERIMENT_LOG.md`,
- commitni zdroj + log dohromady.

Commit message:

```text
exp: test 13MHz reset-default clock
fix: stabilize UART init
diag: add reset-cause telemetry
docs: record EPD BUSY probe result
```

Milníky taguj:

```text
milestone/uart-stable
milestone/epd-busy-confirmed
milestone/epd-first-command
milestone/epd-first-refresh
milestone/nfc-mailbox-read
```

Nikdy nepřepisuj známý funkční stav bez možnosti návratu.

---

# Dokumentace jistoty

Používej pouze tři kategorie:

## OVĚŘENO
Přímo potvrzené:
- hardwarem,
- UART logem,
- buildem,
- fyzickým měřením,
- opakovatelným testem.

## REFERENCE
Pochází z:
- datasheetu,
- veřejného reverse engineeringu,
- příbuzného modelu,
- referenčního driveru.

## HYPOTÉZA
Dosud nepotvrzené na konkrétním GU140.

Nikdy nepovyšuj referenční pinout na „ověřeno“ bez testu.

---

# Aktuální známý problém

Minimální UART baseline firmware se opakovaně restartuje.

Reset cause test opakovaně vypsal:

```text
RESET_CAUSE=0 POR/BROWNOUT
```

Nebyl pozorován opakovaný:

```text
EXTERNAL_RESET_N
WATCHDOG
```

To znamená:
- skutečný restart MCU je OVĚŘENÝ,
- reset cause 0 je OVĚŘENÝ,
- příčina „napájení“ je zatím HYPOTÉZA, protože CC2510 slučuje POR/BROWNOUT do stejné hodnoty.

Watchdog je po resetu standardně disabled dle TI dokumentace a baseline jej neaktivuje.

---

# Doporučená nejbližší diagnostika

Před EPD pokračuj v baseline stabilitě.

Silný A/B test:
- současný 26MHz XOSC aktivní firmware,
- versus reset-default HS-RC přibližně 13 MHz,
- stejné ostatní chování.

Cíl:

```text
power ON
→ právě jedna boot hlavička
→ kontinuální UART heartbeat
→ žádný reset
```

Pokud 13 MHz zásadně změní stabilitu, je to silná stopa k clock/power/load problému.

Agent může tento test připravit, flashnout a vyhodnotit autonomně.

---

# EPD gating

Dokud není baseline stabilní, neprováděj agresivní EPD refresh.

Po stabilizaci postupuj po vrstvách:

```text
passive GPIO observation
→ BUSY candidate
→ power only
→ reset only
→ harmless command/readiness
→ full init
→ blank refresh
→ test pattern
```

Nepřeskakuj validační vrstvy bez důvodu.

---

# Zakázané destruktivní operace bez explicitního souhlasu

- zápis na stock/golden tag,
- mass erase neověřeného targetu,
- debug lock/unlock změny na stock tagu,
- security/config lock bits,
- nekontrolovaný GPIO sweep,
- P2_3/P2_4 jako GPIO,
- external flash bulk/chip erase bez potřeby,
- slepé flashnutí binárky z jiného VUSION modelu,
- napájení tagu 5 V nebo 6 V.

---

# Nejdůležitější pracovní princip

Máš vysokou autonomii, ale cílem není maximalizovat počet flashů.

Cílem je:

**maximalizovat spolehlivou informaci získanou z minimálního počtu kontrolovaných experimentů.**

Pokud máš dost informací pro bezpečný další krok, pokračuj sám.
