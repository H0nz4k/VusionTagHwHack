# Experiment Log

Přidávej nové experimenty nahoru.

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
