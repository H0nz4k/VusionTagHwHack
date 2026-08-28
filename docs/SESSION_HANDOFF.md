# Session Handoff

## Current firmware

```text
v0.5c_rf_rxrssi — last UART-PASS RF image on DEV tag (EXP-036)
```

Last flash attempt: `v0.5d_rf_txping` (EXP-037 UART FAIL). TAG OFF, debug isolated.

Known-good EPD (do not modify): `v0.4k_bwr_19`, `v0.4l_ovhack`.

## RF

Profile `OVH_RF_PROFILE_0`: 2433 MHz GFSK ~10 kBaud, sync `4F56`, PA 0x44 (−30 dBm), CRC+whitening+varlen.

CC2500 on Pi: **no**. No `/dev/spidev*`. Host tests: `python -m unittest discover -s tools/rf_gateway/tests -v`

SDCC: extra `.rel` or extra delay helper → UART garbage from byte 0. Flatten RF targets to `main.c`+clock+uart.

## Next exact physical step

Wire a **3.3 V** CC2500 (e.g. ccRF Click) to Pi SPI. Set `OVH_SPI_BUS` / `OVH_SPI_DEV`. Run `python tools/rf_gateway/cli.py probe` without `--dry-run`. Then RF-E.

Do not tag `milestone/rf-first-packet` until two-way OTA.

Milestones unchanged: display-* + uart-stable + epd-first-refresh.
