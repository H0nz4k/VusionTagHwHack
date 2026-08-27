# Hardware Map

## CC2510 důležité piny — OVĚŘENO / vysoká jistota

```text
physical pin 2  = DVDD
physical pin 15 = P2_1 / Debug Data (DD)
physical pin 16 = P2_2 / Debug Clock (DC)
physical pin 17 = P2_3 / 32 kHz crystal
physical pin 18 = P2_4 / 32 kHz crystal
physical pin 29 = AVDD_DREG
physical pin 30 = DCOUPL
physical pin 31 = RESET_N
physical pin 32 = P1_7
physical pin 33 = P1_6
physical pin 34 = P1_5
physical pin 35 = P1_4
physical pin 36 = P1_3
physical pin 1  = P1_2
```

32kHz crystal continuity na P2_3/P2_4 byla fyzicky ověřena.

## Debug wiring

```text
VUSION / CC2510            CC Debugger
AGND           ----------> pin 1 GND
DVDD           ----------> pin 2 Target Voltage Sense
DD             ----------> pin 4 DD
DC             ----------> pin 3 DC
RESET_N        ----------> pin 7 RESET
```

Debugger pin 9 nepřipojovat.

## Raspberry Pi relé — mapa 2026-08-28

Všechny spínané kontakty jsou **NO**, cívka **active-low**:

```text
BCM GPIO17  Pi pin 11  tag ~3 V
BCM GPIO27  Pi pin 13  3× relé: RESET_N + DD + DC
BCM GPIO21  Pi pin 40  CC Debugger USB +5 V (ne GND)

dl / GPIO LOW  = cívka ON  = NO sepne  = spojeno
dh / GPIO HIGH = cívka OFF = NO otevře = odpojeno
```

Trvale spojené:
- GND debuggeru s tagem
- DVDD → debugger pin 2 (TVCC sense)
- debugger pin 9 (3V3) **nepřipojený**

Fail-safe idle = **17, 27 i 21 `dh`**: tag off, debug odříznutý, USB debugger bez 5 V.

Programátor (`ov26-relays.sh attach`):

```text
GPIO17 ON → GPIO27 ON → GPIO21 OFF 1 s → GPIO21 ON
```

USB se musí enumerovat **až když** tag má 3 V a DD/DC/RESET jsou spojené. Jinak červená LED a `No target`. Zelená LED = debugger vidí TVCC.

Software na Pi:
- boot: `ov26-relays-idle.service` → idle všech tří pinů
- `ov26-relays-guard.timer` každé 2 s: vstup → `op dh`
- skripty **nikdy** nedávají GPIO do `ip`

Cívky ideálně z **externích 5 V**. Při `attach` jede tag + 3 debug + USB 5 V naráz.

UART CP2102 má vlastní USB; GPIO21 ho nespíná.

### Historie polarit / USB (stručně)

- GPIO27 dřív řezalo USB +5 V; teď jen RESET/DD/DC. NO + active-low OVĚŘENO (LOW = 3 LED + kontakty spojené).
- EXP-013: USB ručně znovu zastrčené až po tag+debug ON → `cc-tool` viděl CC2510, zelená LED.
- EXP-012 `No target` při enumeraci bez 3 V / bez USB cyklu.

## Kandidátní GPIO mapa — REFERENCE/HYPOTÉZA

Odvozeno z příbuzného VUSION 4.2, exact-model reverse engineeringu a Pervasive driveru:

```text
P0_0 -> EPD power
P0_1 -> EPD CS
P0_2 -> EPD MISO / maybe unused
P0_3 -> EPD MOSI
P0_4 -> NFC SDA
P0_5 -> EPD SCLK
P0_6 -> NFC SCL
P0_7 -> unknown

P1_0 -> NFC/flash power
P1_1 -> NFC FD
P1_2 -> EPD DC candidate
P1_3 -> EPD BUSY candidate
P1_4 -> external flash CS
P1_5 -> flash SCLK
P1_6 -> flash MOSI / temporary diagnostic UART TX
P1_7 -> flash MISO

P2_0 -> EPD reset candidate
P2_1 -> LED control / debug DD
P2_2 -> LED boost / debug DC
P2_3 -> 32 kHz crystal — OVĚŘENO
P2_4 -> 32 kHz crystal — OVĚŘENO
```

## P2 LED — REFERENCE GL340 + GU140 stav

GL340 [`util.h`](https://github.com/fanhuanji/VUSION4.2BWR_GL340/blob/main/src/util.h): P2_1=`LED_ON`, P2_2=`LED_BOOST`. Ne RGB kanály.

PCB overlay: LED_A/B/C/D = krátké katody RGBW; LED_COM = long net k boost VOUT = **common anode**; TPS61071EN = P2_2. Detail `docs/LED_GL340_TRACE.md`.

GU140 RGB pouzdro **OVĚŘENO** diode-test: common-anode, tři katody R/G/B, všechny čipy živé. Bílá je samostatná LED.

EXP-021 **OVĚŘENO**: při OFF / P2_1 / P2_2 / BOTH (RGB WHITE) se mění jen P2 bity 1 a 2. `P0DIR=00`, žádný třetí LED výstup. R-/G-/B- nejsou MCU GPIO v tomto stavu. Detail `docs/LED_GL340_TRACE.md`.

## Session 2026-08-27 — GPIO pozorování (chování OVĚŘENO, identita HYPOTÉZA)

Při 26 MHz, bez SPI, debugger připojen:

```text
P1_3 boot, undriven     : 1 → 0, then static 0
P0_0=1 (cand. PWR OFF)  : P1_3=1
P0_0=0 (cand. PWR ON)   : P1_3=0
P0_0=1, P2_0=0          : P1_3=1
P0_0=1, P2_0=1          : P1_3=0
after P2_0 H/L/H, P0_0=0: P1_3 stays 0
```

P1_3 proto **není** potvrzený EPD BUSY. Referenční Pervasive ready=HIGH po resetu nenastalo. P1_3 reaguje na P2_0 i ve stavu „P0_0 OFF“.

## Důležité omezení

P2_3/P2_4:
- nikdy GPIO,
- nikdy sweep,
- nikdy drive high/low.
