# References

## TI CC2510

Používej TI CC2510/CC2510F datasheet jako primární MCU referenci.

Relevantní témata:
- reset causes,
- SLEEP.RST,
- clock system,
- watchdog,
- USART1 Alternative 2,
- GPIO peripheral mapping,
- DCOUPL / internal regulator.

## Exact GU140 reverse engineering

Jirka Balhar — *Hacking SES imagotag E-ink Price Tag* (2023):
- **EXACT-MODEL REFERENCE** (VUSION 2.6 BWR GU140 + E2266JS0C2)
- ne OVĚŘENO na našem PCB revision
- článek nemá CC2510 GPIO tabulku; mapa = Figure 5-1 + overlay + GL340

https://blog.jirkabalhar.cz/2023/12/hacking-sesimagotag-e-ink-price-tag/

Detail: `docs/EPD_REFERENCE.md`.

## Related firmware

GitHub:
- `fanhuanji/VUSION4.2BWR_GL340`

Používej pouze jako příbuznou architektonickou/pinout referenci.
Nikdy jeho binárku slepě neflashuj do GU140.

## Pervasive Displays

Official reference driver:
- `PervasiveDisplays/EPD_Driver_GU_small`

Používej jako EPD command/init reference pro E2266 family.
