# EPD Reference

## Exact-model public reverse engineering

Veřejný reverse engineering VUSION 2.6 BWR GU140 uvádí:
- TI CC2510
- Pervasive Displays E2266JS0C2 / SE2266JS0C2
- 2.66"
- 296×152
- black/white/red
- panel byl úspěšně řízen náhradním MCU pomocí Pervasive driveru.

Toto je silná REFERENCE, ale konkrétní GPIO mapu na našem kuse je nutné ověřovat.

## Official Pervasive driver reference

Rodina:
- eScreen_EPD_266 / xE2266CSxxx
- 296×152
- BWR
- frame plane size cca 5624 bytes
- dvě obrazové roviny pro BWR

Referenční sekvence zahrnuje:
- hardware reset H/L/H
- soft reset command `0x00`, data `0x0E`
- temperature config `E5=19`, `E0=02`
- PSR `0x00` data `CF 8D`
- frame commands `0x10` a `0x13`
- DCDC power-on `0x04`
- refresh `0x12`
- power-off `0x02`
- BUSY se čeká do HIGH.

## Gating

Neaplikuj full refresh, dokud nejsou rozumně ověřené:
- EPD power
- CS
- DC
- CLK
- MOSI
- RESET
- BUSY

`P1_3 == 1` samo o sobě není potvrzení BUSY pinu.

2026-08-27: P1_3 šel po v0.3e reset probe do 0 a zůstal 0. Navíc 1→0 už při P2_0=1 a P0_0 ve stavu OFF. To je důvod **nepokračovat** na CoG/SPI/refresh, dokud vazba P2_0↔P1_3 a polarita P0_0 nejsou lépe izolované.
