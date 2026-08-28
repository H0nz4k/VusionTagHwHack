# CC2500 gateway (Raspberry Pi)

## Hardware tonight

**CC2500 není na lab Pi (2026-08-28).** `ls /dev/spidev*` → prázdné. `ovh-rf probe` musí selhat hláškou, ne falešným PARTNUM.

Plán: MikroElektronika ccRF Click MIKROE-1435, **3.3 V only**. Ne 5 V na MOSI/CS.

## SPI mapa (koncept, ne hádání pinů)

```text
3.3V  GND  SCK  MOSI  MISO  CS  GDO0  [GDO2]  [RESET]
```

Čísla BCM pinů **nejsou** v kódu natvrdo. `tools/rf_gateway/config.example.json` + env:

```text
OVH_SPI_BUS  OVH_SPI_DEV  OVH_SPI_CS
OVH_GDO0_BCM  OVH_GDO2_BCM  OVH_CC2500_RESET_BCM
```

Bez config a bez `--dry-run` probe odmítne GPIO.

## Driver (`cc2500.py`)

- CSn low, wait MISO low (CHIP_RDYn), bounded timeout
- header: R/nW bit7, burst bit6, addr 5:0
- strobes 0x30–0x3D (SWRS040) — **ne** CC2510 RFST čísla
- PARTNUM 0x30 VERSION 0x31 MARCSTATE 0x35 RSSI 0x34 (status, read with 0xC0 burst/status)
- FIFO TX 0x3F / RX 0x3F + read bit
- žádný nekonečný poll

Očekávané ID (REFERENCE, CC2500 datasheet): PARTNUM často `0x80`. VERSION silicon-dependent. Probe PASS = opakovatelný ne-0xFF/ne-timeout readback, ne „hádáme 0x80“.

## CLI

```text
ovh-rf probe
ovh-rf regdump
ovh-rf rssi --seconds 5
ovh-rf rx --seconds 10
ovh-rf tx-ping --count 3
ovh-rf ping --tag 1
```

`--dry-run` `--verbose` `--trace` (JSONL).
