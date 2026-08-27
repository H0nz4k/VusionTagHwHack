# Toolchain and Remote Lab

## SSH

Alias:

```text
vusion-rpi
```

Test:

```bash
ssh vusion-rpi 'hostname; whoami; pwd'
```

## Remote firmware root

```text
/home/hw/OpenVusion26_FW
```

Známá UART diagnostická větev:

```text
/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
```

## Build tools

Expected:
- `sdcc`
- `cc-tool`
- `pinctrl`

Check:

```bash
ssh vusion-rpi 'which sdcc; which cc-tool; which pinctrl'
```

## UART

```text
/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
```

## Local ↔ remote source workflow

Pull:

```bash
bash scripts/pull-from-rpi.sh
```

Push:

```bash
bash scripts/push-to-rpi.sh
```

Agent má přednostně editovat lokální `firmware/` a pak synchronizovat na RPi.

## Flash workflow — OVĚŘENO 2026-08-27

UART_DIAG `flash.sh`:

```bash
sudo cc-tool -v read -e -w "$HEX"
```

Význam:

- `-e` — erase flash (DEV tag only)
- `-w file.hex` — write Intel HEX (přípona musí být `.hex`, ne `.ihx`)
- `-v read` — verify metodou read-back, ne CCR
- target musí být napájen (`cc-tool -t` jinak target neuvidí)
- passwordless `sudo cc-tool` na uživateli `hw` funguje
- po zápisu cc-tool target resetuje a firmware začne běžet

Identita před zápisem: `cc-tool -t` musí ukázat `ID: 0x2510`. To rozliší MCU, ne DEV vs stock — DEV je určen fyzickým zapojením.

HIL helpery v `scripts/`:

- `hil-flash-capture.sh` — flash + relé cyklus (relé při debuggeru MCU neresetuje)
- `hil-flash-reset-capture.sh` — flash + idle + `cc-tool --reset`
- `hil-capture-through-flash.sh` — UART běží už během programování, chytí post-flash boot
- `hil-idle-capture.sh` / `hil-ccreset-capture.sh` — bounded 1–60 s

Žádný z nich nemá `while true`.

## Clock / UART init (UART_DIAG)

26 MHz: `clock_init_26mhz()` — OSC_PD=0, čeká XOSC_STB, CLKCON OSC=0 a CLKSPD=000, pak OSC_PD=1.

13 MHz: `clock_init_hsrc_13mhz()` — XOSC se nespouští, OSC=1, CLKSPD=000.

UART 115200:

- 26 MHz: `U1BAUD=34`, `BAUD_E=12`
- 13 MHz nominál: `U1BAUD=34`, `BAUD_E=13` (HSRC není přesný krystal)
