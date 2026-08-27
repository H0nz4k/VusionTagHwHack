# OpenVusion 2.6 BWR GU140 — staged CC2510 firmware lab

Prepared for the already-erased/unlocked DEV tag.

The design goal is to stop guessing and move through increasingly invasive,
observable stages. Every stage emits telemetry on a 3.3-V UART.

## Important: first runtime wiring

Add only:

```text
CC2510 P1_6 / pin 33  -> USB-TTL RX (3.3-V logic)
GND                    -> USB-TTL GND
```

Do **not** connect USB-TTL VCC.

The CC Debugger stays wired for programming, but the runtime test must be
power-cycled with the debugger disconnected from the tag as before.

UART is 115200 8N1.

## Stage plan

### v0.3_reference_probe — RUN THIS FIRST

Risk: low.

Does:
- switches CC2510 to 26-MHz crystal
- proves UART telemetry
- proves the WDT timebase
- keeps EPD CS inactive
- never sends an SPI byte
- never touches P1_2
- exercises only candidate:
  - P0_0 EPD power
  - P0_1 EPD CS
  - P2_0 EPD reset
  - P1_3 EPD BUSY input
- logs BUSY transitions

A BUSY transition after power/reset is strong evidence for the candidate map.
No transition is inconclusive.

### v0.4_cog_probe — PREPARED, HOLD

Risk: moderate.

Prerequisite:
- v0.3 looks plausible
- P1_2 as EPD D/C is accepted/verified

Does:
- initializes USART0 SPI
- performs the official Pervasive 2.66" CoG init
- sends no frame data
- sends no display-refresh command
- checks BUSY with timeouts
- powers down safely

### v0.5_epd_testpattern — PREPARED, HOLD

Risk: intended/destructive only to current image content.

Prerequisite:
- v0.4 PASS

Does one real update:
- E2266JS0C2 296×152
- 5624 bytes per plane
- sends a three-band BLACK / WHITE / RED test pattern
- refreshes once
- powers the CoG down
- then idles forever; it does not continuously refresh

### v0.6_nfc_probe — PREPARED DRAFT, HOLD

Risk: low/moderate, but candidate NFC map is not yet proven on exact board.

Does:
- candidate P1_0 NFC power
- bit-banged I2C on P0_4/P0_6
- only checks ACK at 8-bit write address 0xAA
- does not write NFC memory

## Build

On the Raspberry Pi:

```bash
cd ~/OpenVusion26_GU140_FW_2026-08-26
chmod +x *.sh
./build_one.sh v0.3_reference_probe
```

Expected output:

```text
build/v0.3_reference_probe.ihx
build/v0.3_reference_probe.hex
```

The `.hex` copy exists because this installed `cc-tool` recognizes the file
type by extension.

## Flash v0.3

With battery/tag power ON and CC Debugger attached:

```bash
./flash.sh v0.3_reference_probe
```

Internally this uses the already proven command:

```bash
sudo cc-tool -v read -e -w build/v0.3_reference_probe.hex
```

After successful verify:

1. switch tag power OFF
2. disconnect CC Debugger from the tag
3. connect USB-TTL RX/GND
4. start the monitor
5. switch tag power ON

## Monitor

```bash
sudo apt install -y picocom
./monitor.sh /dev/serial/by-id/<USB-TTL-device>
```

or:

```bash
./monitor.sh /dev/ttyUSB0
```

Expected v0.3 start:

```text
OpenVusion 2.6 GU140 reference probe v0.3
UART1 Alt2 TX=P1_6 @115200 8N1
P1_2 is NOT touched in this stage.
timer selftest: wait ~500 ms ...
timer selftest: OK
...
```

Then it logs BUSY before and after candidate power/reset operations.

## Logic-analyzer option

If UART is unavailable, capture P1_6 and decode UART 115200 8N1.
For EPD work the most useful additional channels are:

```text
P0_0  EPD_PWR
P0_1  EPD_CS
P0_3  EPD_MOSI
P0_5  EPD_SCLK
P1_2  candidate EPD_DC
P1_3  EPD_BUSY
P2_0  EPD_RESET
```

## Safety

- Current DEV tag stock firmware is already erased; these scripts still erase
  before every flash because cc-tool requires erase for writing.
- Never use these erase/write commands on a golden stock tag.
- Debugger pin 9 (3.3 V output) remains unconnected.
- Tag is powered from its own battery/supply.
- Never scan/toggle P2_3/P2_4: those 32-kHz crystal connections were measured
  directly on this board.
- v0.4/v0.5 are intentionally gated. Do not skip v0.3.
