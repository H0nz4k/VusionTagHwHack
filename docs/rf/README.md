# Rádio — dvě větve, žádný OTA na GU140

**Není** reverse-engineering originálního Vusion/SoluM RF.

## Větev 1 — pasivní 2.4 GHz observatoř (OVĚŘENO jako energy probe)

Hardware: Nordic **nRF52840 dongle** + vlastní Zephyr FW `OpenVusion_RF_Probe_v0.7.2` (`tools/Donge`).  
Host UI: **WaterFall 0.4.1** (`tools/Waterfall`).

Umí RSSI sweep 2400–2500 MHz, WATCH burst, SQLite capture. Firmware **nevysílá** pakety a **nedekóduje** Vusion MAC.

Silný pík na nějakém MHz je jen energie. Není to důkaz našeho ani stock protokolu.

## Větev 2 — vlastní OVH RF v0.1 (částečně OVĚŘENO)

Cíl: Pi + **CC2500** SPI ↔ GU140 **CC2510** radio (RFD/RFST, ne SPI FIFO).

```text
RF-A dump SFR     EXP-034  OVĚŘENO UART
RF-B IDLE profil  EXP-035  OVĚŘENO write/readback
RF-C RX/RSSI      EXP-036  OVĚŘENO bounded
RF-D TX ping      EXP-037  UART FAIL / OTA neprovedeno
RF-E CC2500 probe          BLOK: na lab Pi není /dev/spidev*
RF-F CC2500↔CC2500         čeká hardware
RF-G GU140 PING/PONG       milestone/rf-first-packet
```

Profil `OVH_RF_PROFILE_0` (REFERENCE výpočet SWRS055 + OVĚŘENO zápis na silicon):

| | |
|---|---|
| Nosná | 2433.000 MHz |
| Modulace | GFSK ~9.993 kBaud |
| Sync | `0x4F56` (`OV`) |
| TX power | −30 dBm (`PA_TABLE0=0x44`) |
| Max PDU | 48 B + radio CRC |

Kód: sourozenec `tools/rf_gateway/`, FW `v0.5a`…`v0.5d`. Plánovaný modul: MikroElektronika ccRF Click (CC2500, 3.3 V). **5 V do CC2500 ne.**

CC2510 ≠ CC2500 driver: host SPI FIFO vs jednobajtové `RFD`. Strobes jiná čísla.

## Co čeká

1. Fyzicky zapojit CC2500 3.3 V SPI na Pi (člověk).
2. RF-E probe, pak RF-F dva moduly, pak RF-G na DEV.
3. Teprve potom image transfer vzduchem (`docs/rf/IMAGE_TRANSFER.md` v sourozenci — návrh, ne kód).

Dokud není obousměrný OTA důkaz, `milestone/rf-first-packet` neoznačuj.
