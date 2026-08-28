# Known Facts / Current State

## OVĚŘENO — zařízení

Model:
- VUSION 2.6 BWR GU140 family

MCU:
- TI CC2510, QFN-36
- `cc-tool -t`: Name CC2510, ID `0x2510`, Internal ID `0x04`, Revision `0x81`

DEV kus:
- originální firmware byl úmyslně smazán,
- custom firmware lze kompilovat a flashovat,
- `cc-tool` erase + write + verify (`-v read`) funguje,
- artifact je `.hex` (ne `.ihx` přípona).

## OVĚŘENO — UART

CC2510:
- P1_6 / physical pin 33

CP2102:
- RXD připojen k P1_6
- GND společná
- TXD/VCC nepřipojené

Parametry:
- 115200 8N1
- USART1 Alternative 2
- na 26 MHz XOSC je streamovaný text čitelný
- na nominálních 13 MHz HS-RCOSC jsou dlouhé bannery poškozené (RCOSC nekálibruje se na krystal); izolované tečky s mezerou jdou dekódovat

Linux path:

```text
/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
```

## OVĚŘENO — napájení tagu přes relé

Raspberry Pi, NO, active-low:

```text
BCM GPIO17  tag ~3 V
BCM GPIO27  RESET_N + DD + DC
BCM GPIO21  CC Debugger USB +5 V
```

TAG ON:

```bash
pinctrl set 17 op dl
```

TAG OFF:

```bash
pinctrl set 17 op dh
```

**Při připojeném CC Debuggeru (linky + USB) TAG OFF MCU nevypne.** Parazitní napájení přes debug piny je OVĚŘENO. Debug linky nejdřív odříznout (GPIO27 `dh`).

**Bez debug kabelu / s odříznutými linkami TAG OFF MCU vypne.** EXP-011.

USB debugger se musí enumerovat až po tag 3 V + DD/DC/RESET (GPIO21 cyklus). EXP-013 ruční replug → CC2510. GPIO21 to má dělat automaticky.

UART CP2102 GPIO21 nespíná. Debugger pin 9 (3.3 V) nepřipojený.

## OVĚŘENO — reset cause v této lab konfiguraci

`cc-tool --reset` na v0.3a:

```text
RESET_CAUSE=1 EXTERNAL_RESET_N
```

SLEEP.RST čtení v software funguje.

Spontánní opakovaný

```text
RESET_CAUSE=0 POR/BROWNOUT
```

se 2026-08-27 při debuggeru + TAG ON **neobjevil** na starém kusu.

Nový DEV, v0.3a, **bez debug kabelu** (EXP-011): jeden boot, `RESET_CAUSE=1 EXTERNAL_RESET_N` (RC na RESET_N při náběhu — HYPOTÉZA), pak heartbeat, **žádná smyčka**.

S debug kabelem na tagu a GPIO27 off (EXP-010): 708× `EXTERNAL_RESET_N` / 20 s. To byl RESET_N z debuggeru, ne brownout.

Bez debuggeru (EXP-006, v0.3e) true POR **ano** spustil rychlou reset smyčku: 1714× banner za 30 s, vždy končí na `OFF/RST0 BUSY=1`. Firmware nahlásí RESET_CAUSE až po reflashi v0.3a.

**HISTORICAL OBSERVATION:** experiment zahrnoval P2_0 a koreloval se stormem.  
**UNKNOWN:** kauzalita P2_0 → reset MCU není prokázána. Nepovyšuj na vlastnost EPD_RESET.

**OVĚŘENO EXP-024 (isolation, GPIO27+21 dh):** P2_0 H-L-H po P0_0=0 MCU nestormuje. Historický storm se za těchto podmínek nereprodukoval.

## OVĚŘENO — DCOUPL

Na CC2510 DCOUPL bylo dříve změřeno přibližně:

```text
1.79 V
```

To odpovídá očekávané interní cca 1.8V digitální větvi.

## OVĚŘENO — P1_3 / P0_0 / P2_0 chování (ne identita)

Při 26 MHz, debugger připojen, TAG ON, žádný SPI:

- P1_3 po bootu (žádný EPD drive): `1` → `0`, pak staticky `0`
- P0_0=1 (candidate power OFF): P1_3=`1`
- P0_0=0 (candidate power ON): P1_3=`0` (12 vzorků)
- P0_0=1 a P2_0=0: P1_3=`1`
- P0_0=1 a P2_0=1: P1_3=`0`
- Po P2_0 H/L/H a P0_0=0: P1_3 zůstane `0`

MCU žádný z těchto kroků neshodil.

Identita „EPD BUSY / EPD POWER / EPD RESET“ z těchto debugger-attached testů zůstává **HYPOTÉZA**.

### Isolated (EXP-022..025, GPIO27+21 dh)

- EXP-022: P1_3 staticky `0`, žádný EPD drive, MCU žije
- EXP-023: P0_0 OFF→ON→OFF, P1_3 stále `0`, MCU žije
- EXP-024: P0_0=0 + P2_0 H-L-H, MCU žije. P1_3 = `0` před/během pulzu, `1` ihned po RST H2 a po celý heartbeat
- EXP-025: USART0 Alt1 idle. POST `P0SEL=28` `P0DIR=2B` `U0CSR=00`. P0_2 SEL/DIR=0, CS=1, žádný byte, P1_3=1, MCU žije

P1_3 **reaguje na EPD reset po PWR ON** (silná evidence kandidáta BUSY). Polarita a command-BUSY nejsou OVĚŘENO. MOSI/SCLK fyzické mapování není OVĚŘENO.

## NEJISTÉ MĚŘENÍ

Byl hlášen rozsah:

```text
0.35–1.2 V
```

při měření bodu považovaného za DVDD.

Protože to není konzistentní s DCOUPL 1.79 V a s opakovaným během MCU, považuj tento údaj za NEOVĚŘENÝ, dokud nebude opakován na bezpečném a známém napájecím bodu.

## TI DOKUMENTACE / REFERENCE

CC2510 reset cause:
- `SLEEP.RST[1:0]`
- `00` = power-on or brown-out
- `01` = external reset
- `10` = watchdog

Watchdog je po system resetu disabled, dokud jej software neaktivuje.

CLKCON (CC2510):
- bit7 OSC32K, bit6 OSC, bits2:0 CLKSPD
- OSC=0 → 26 MHz XOSC, OSC=1 → 13 MHz HS RCOSC
- reset default CLKSPD=001 → HS-RCOSC/2 ≈ 6.5 MHz, pokud se CLKSPD neupraví

## Nejbližší otevřená otázka

1. LED: společný sink vs tři FET (fyzické měření, TAG OFF).
2. Pak EPD žebřík k `milestone/epd-first-refresh` — `docs/EPD_REFERENCE.md`. Identita P0_0/P2_0/P1_3 zůstává REFERENCE.
