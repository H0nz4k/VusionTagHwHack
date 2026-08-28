# Lab bench (OVĚŘENO 2026-08-28)

Fotka sestavy: [`captures/ov26_lab_bench.png`](../captures/ov26_lab_bench.png). Sklo volba 3: [`captures/ov26_exp056_slot3_glass.png`](../captures/ov26_exp056_slot3_glass.png). Paleta volba 2: [`captures/ov26_exp054_slot2_palette_glass.png`](../captures/ov26_exp054_slot2_palette_glass.png).

## Kusovník

| Kus | Role | Poznámka |
|---|---|---|
| VUSION 2.6 BWR GU140 | DEV tag | originální FW smazaný; panel Pervasive **E2266JS0C2** 152×296 B/W/R |
| TI CC2510 (QFN-36) | MCU na tagu | ID `0x2510`; ~3 V (DVDD/AVDD 2.0–3.6 V); DCOUPL ≈ 1.79 V |
| Raspberry Pi | lab host `vusion-rpi` | user `hw`; firmware `/home/hw/OpenVusion26_FW` |
| Relé deska (modrá, NO) | napájení a debug linky | active-low: `dl`=ON, `dh`=OFF |
| TI CC Debugger clone | programátor | USB `0451:16a2`; `cc-tool`; **pin 9 (3.3 V) nepřipojen** |
| Plochý ribbon + červená breakout deska | debug kabel | GND, TVCC sense, DD, DC, RESET |
| CP2102 USB-TTL | diagnostický UART | jen GND + RXD; **ne** VCC/3V3/5V/TXD |
| ELATEC TWN4 | NFC čtečka | USB `09d8:0420`; CDC **`/dev/ttyACM0`** (nikdy `ttyUSB0`) |
| Manuální páčkový spínač | pomocný cut-off | vedle relé na stole |

## Relé (BCM)

```text
GPIO17  Pi pin 11  tag ~3 V
GPIO27  Pi pin 13  RESET_N + DD + DC
GPIO21  Pi pin 40  debugger USB +5 V
```

Stock napájení tagu: 2× CR2450 paralelně (~3 V, větší kapacita). Na stole běží tag z relé 3 V větve.

## Debug wiring

```text
Tag / CC2510              CC Debugger
AGND                      pin 1 GND
DVDD                      pin 2 Target Voltage Sense
DD / P2_1 (pin 15)        pin 4 DD
DC / P2_2 (pin 16)        pin 3 DC
RESET_N (pin 31)          pin 7 RESET
```

Programátor: nejdřív tag 3 V + debug linky, teprve pak USB +5 V (GPIO21), ať enumeruje se zelenou LED / TVCC.

## UART

```text
CC2510 pin 33 / P1_6  →  CP2102 RXD
GND                   →  CP2102 GND
115200 8N1, USART1 Alternative 2
/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
```

P0_3 není UART (EPD MOSI). Runtime testy s odpojeným debuggerem (GPIO27+21 `dh`).

## NFC cesta (SHOW)

```text
TWN4 /dev/ttyACM0
  → ISO14443-A WRITE page 0x30  ("OVH" + 1..4)
  → NTAG I²C Plus 1K  UID 04367F5A2D7280
  → I2C 0xAA  SDA P0_4 / SCL P0_6  block 0x0C
  → CC2510  →  EPD CoG (v0.4k/v0.4l)
```

## Toolchain na Pi

SDCC 4.2.0 `#13081`, `-mmcs51 -pcc2510fx --model-small --iram-size 256 --xram-loc 0xF000 --xram-size 0xF00 --code-size 32768`. `cc-tool` chce `.hex` (ne `.ihx`).

## Zakázáno bez lidského souhlasu

Stock/golden tag: erase/write/lock. P2_3/P2_4 jako GPIO. Napájení tagu 5 V / 6 V.

---


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

## Raspberry Pi relé — mapa 2026-08-29

Všechny spínané kontakty jsou **NO**, cívka **active-low**:

```text
BCM GPIO17  Pi pin 11  tag ~3 V
BCM GPIO27  Pi pin 13  3× relé: RESET_N + DD + DC
BCM GPIO21  Pi pin 40  CC Debugger USB +5 V (ne GND)
BCM GPIO20  Pi pin 38  TWN4 USB +5 V (ne tag, ne USB data)

dl / GPIO LOW  = cívka ON  = NO sepne  = spojeno
dh / GPIO HIGH = cívka OFF = NO otevře = odpojeno
```

Trvale spojené:
- GND debuggeru s tagem
- DVDD → debugger pin 2 (TVCC sense)
- debugger pin 9 (3V3) **nepřipojený**

Fail-safe idle = **17, 27, 21 i 20 `dh`**: tag off, debug odříznutý, debugger USB i TWN4 USB bez 5 V.

**GPIO20 TWN4** (`ov26-relays.sh twn4-on` / `twn4-off`): stejné NO active-low. `dl` = čtečka ON (RF), `dh` = OFF. NFC test: tag 3 V první, potom TWN4 USB, čekat `09d8:0420` / `/dev/ttyACM0`. `attach` TWN4 nespíná. **OVĚŘENO** 2026-08-29 `ov26-hw-inventory.sh`: idle 20 hi → `twn4-on` `09d8:0420`+`ttyACM0` → `twn4-off` USB pryč.

Programátor (`ov26-relays.sh attach` / `reconnect`):

```text
GPIO17 ON → GPIO27 ON → GPIO21 OFF 1 s → GPIO21 ON
```

USB se musí enumerovat **až když** tag má 3 V a DD/DC/RESET jsou spojené. Jinak červená LED a `No target`. Zelená LED = debugger vidí TVCC.

**Nikdy `usb-on` samo** po recap/idle, který nechal GPIO27 `dh`. `usb-on` teď odmítne, pokud 17 nebo 27 nejsou ON, a jinak provede USB cyklus (21 off 1 s, pak on). Znovuzapojení = `attach` / `reconnect`.

Software na Pi:
- boot: `ov26-relays-idle.service` → idle všech čtyř pinů
- `ov26-relays-guard.timer` každé 2 s: vstup → `op dh`
- `ov26-relays-guard.timer` každé 2 s: vstup → `op dh`
- skripty **nikdy** nedávají GPIO do `ip`

Cívky ideálně z **externích 5 V**. Při `attach` jede tag + 3 debug + USB 5 V naráz.

UART CP2102 má vlastní USB; GPIO21 ho nespíná.

### Historie polarit / USB (stručně)

- GPIO27 dřív řezalo USB +5 V; teď jen RESET/DD/DC. NO + active-low OVĚŘENO (LOW = 3 LED + kontakty spojené).
- EXP-013: USB ručně znovu zastrčené až po tag+debug ON → `cc-tool` viděl CC2510, zelená LED.
- EXP-012 `No target` při enumeraci bez 3 V / bez USB cyklu.

## Kandidátní GPIO mapa — EPD je REFERENCE, ne OVĚŘENO

EPD signály: **EXACT-MODEL REFERENCE** (Balhar GU140 + Pervasive Figure 5-1) složená s **RELATED-MODEL** GL340 CC2510 piny. Shoda sady signálů zvyšuje jistotu. Na našem kusu identita **není** OVĚŘENO. Detail `docs/EPD_REFERENCE.md`.

```text
P0_0 -> EPD_PWR (active LOW)     REFERENCE GL340 + power switch Fig 5-1
P0_1 -> EPD_CS                   REFERENCE GL340 + FPC 12
P0_2 -> leave input/untouched     mimo first-refresh (MISO)
P0_3 -> EPD_MOSI USART0 Alt1     REFERENCE GL340 + FPC 14 SDA
P0_4 -> NFC SDA                  RELATED-MODEL
P0_5 -> EPD_SCLK USART0 Alt1     REFERENCE GL340 + FPC 13 SCL
P0_6 -> NFC SCL                  RELATED-MODEL
P0_7 -> unknown

P1_0 -> NFC/flash power          RELATED-MODEL
P1_1 -> NFC FD                   RELATED-MODEL
P1_2 -> EPD_DC                   REFERENCE GL340 + FPC 11
P1_3 -> EPD_BUSY (ready = HIGH)  REFERENCE GL340 + FPC 9; HIL identita INCONCLUSIVE
P1_4 -> external flash CS
P1_5 -> flash SCLK
P1_6 -> flash MOSI / diagnostic UART TX   OVĚŘENO UART
P1_7 -> flash MISO

P2_0 -> EPD_RESET candidate      REFERENCE; storm z EXP-006 = HISTORICAL, kauzalita UNKNOWN
P2_1 -> LED control / debug DD   OVĚŘENO debug + LED
P2_2 -> LED boost / debug DC     OVĚŘENO debug + LED
P2_3 -> 32 kHz crystal           OVĚŘENO continuity
P2_4 -> 32 kHz crystal           OVĚŘENO continuity
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
