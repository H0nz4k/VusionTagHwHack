# OpenVusion GU140 — UART diagnostic ladder

The first capture already proves that P1_6 / pin 33 -> CP2102 RXD works and
115200 baud is decodable.

But the repeated/partial startup text means the first combined probe is not a
clean measurement. Do NOT advance to CoG/SPI yet.

Run one stage at a time:

1. `v0.3a_uart_baseline`
   - UART only
   - no EPD GPIO
   - no WDT
   - prints `RESET CAUSE TEST` then dots
   - 26 MHz XOSC

1b. `v0.3b_hsrc_13mhz`
   - same as v0.3a but HS-RCOSC ~13 MHz, no XOSC
   - UART BAUD_E=13 for nominal 115200
   - HSRC is uncalibrated; long banners may garble

2. `v0.3c_busy_passive`
   - only reads P1_3 as high-Z
   - does not drive EPD

3. `v0.3d_power_only`
   - drives only candidate P0_0 EPD power
   - no reset, no SPI
   - if boot banner repeats immediately after `POWER ON NOW`, stop

4. `v0.3e_reset_probe`
   - only if power-only is stable
   - adds P2_0 reset H/L/H
   - logs BUSY samples

Build/flash example:

```bash
./build_one.sh v0.3a_uart_baseline
./flash.sh v0.3a_uart_baseline
```

Then:
- power OFF
- disconnect CC Debugger from tag
- leave CP2102 RXD/GND
- start picocom
- power ON
