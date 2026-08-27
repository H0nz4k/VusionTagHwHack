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

## Raspberry Pi relé

### Zamýšlené zapojení (lidský zásah 2026-08-27 večer)

```text
BCM GPIO17  Pi pin 11  tag ~3 V
BCM GPIO27  Pi pin 13  3× relé naráz: RESET_N + DD + DC

dl / GPIO LOW  = cívka ON  = NO sepne  = spojeno
dh / GPIO HIGH = cívka OFF = NO otevře = odpojeno
```

USB CC Debugger (+5 V) už GPIO27 **neřeže** — má zůstat pořád enumerovaný.

Trvale spojené (nespínat):
- GND
- DVDD → debugger pin 2 (TVCC sense)
- debugger pin 9 (3V3) pořád nepřipojený

Fail-safe: idle = obě `dh` = tag 3V off **a** debug linky odříznuté.

Software (nainstalováno na Pi):
- boot: `ov26-relays-idle.service` hned `17/27 op dh`
- každé 2 s: `ov26-relays-guard.timer` — kdyby pin spadl do vstupu, znovu `op dh`
- skripty **nikdy** nedávají GPIO do `ip`

Při flashi (GPIO17 + tři cívky GPIO27 naráz) ideálně cívky z **externích 5 V**, ne z pinu 2 Pi.

### OVĚŘENO EXP-012 — USB a polarita GPIO

```text
GPIO27 dh, idle: USB 0451:16a2 přítomné  (5V vyhybka je pryč)
GPIO27 dl i dh:  Programmer: CC Debugger, No target detected
```

GPIO27 **už neovládá USB enumeraci**. Historické `dh → USB zmizí` platí jen pro staré zapojení (debugger USB +5 V).

### EXP-012 — debug bus k CC2510 zatím NENÍ OVĚŘENÝ

`cc-tool -t` nevidí CC2510 v **obou** polaritách GPIO27. To není NC vs NO (pak by jedna polarita target viděla). Debug cesta RESET/DD/DC k čipu je otevřená nebo není na tagu.

Zároveň MCU běží i při GPIO17 `dh`: 8 teček / 8 s. Tag 3V relé teď **nestačí k vypnutí**. Zdroj je HYPOTÉZA: parazit přes trvale zapojený DVDD sense do živého debuggeru, nebo baterie v tagu.

UART CP2102 má vlastní USB a GPIO27 ho nespíná.

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

## P2 LED pozorování

Historické experimenty na P2_1/P2_2:
- různé kombinace vedly k bílé a cyan/azure LED aktivitě,
- debugger sdílí P2_1/P2_2,
- výsledky nejsou dostatečně čisté pro definitivní mapu.

Reference VUSION 4.2:
- P2_1 = LED control
- P2_2 = LED boost

Na GU140 to zatím eviduj jako REFERENCE/HYPOTÉZA.

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
