# Reference matrix

## Exact-model reverse engineering

Jirka Balhar, *Hacking SES imagotag E-ink Price Tag*:
- **EXACT-MODEL REFERENCE**, not OVĚŘENO on our PCB revision
- VUSION 2.6 BWR GU140, CC2510, E2266JS0C2 / SE2266JS0C2
- PCB drive circuit matches Pervasive Figure 5-1; overlay traces to original CC2510; RP2040 + `eScreen_EPD_EXT3_266_BWR` refreshed the panel
- article does **not** publish CC2510 GPIO numbers — reconstruct from FPC 9–14 + GL340 `epd.h`

https://blog.jirkabalhar.cz/2023/12/hacking-sesimagotag-e-ink-price-tag/
See `docs/EPD_REFERENCE.md`.

## Related VUSION CC2510 firmware

fanhuanji/VUSION4.2BWR_GL340:
- CC2510 / SDCC
- EPD PWR=P0_0, CS=P0_1, DC=P1_2, BUSY=P1_3, RESET=P2_0
- EPD SPI USART0 Alt1, P0_3/P0_5
- NFC SDA=P0_4, SCL=P0_6
- flash USART1 Alt2, P1_4..P1_7
- LED macros on P2_1/P2_2
- source build parameters match our working SDCC setup

https://github.com/fanhuanji/VUSION4.2BWR_GL340

## Official Pervasive driver

PervasiveDisplays/EPD_Driver_GU_small:
- 2.66" resolution 296×152
- plane size 5624 bytes
- non-4.2" init bytes: 00,0E,19,02,CF,8D
- global update uses 0x10 and 0x13 frame planes, then 0x04 and 0x12
- BUSY is waited until HIGH
- power-off command 0x02

https://github.com/PervasiveDisplays/EPD_Driver_GU_small

## TI CC2510

TI CC2510 datasheet / basic examples:
- HS XOSC 26-MHz startup sequence used in common/clock.c
- USART TX_BYTE behavior
- USART1 Alternative 2 can provide diagnostic UART
- 115200 at 26 MHz can use BAUD_M=34, BAUD_E=12 (~115051 baud)

https://www.ti.com/product/CC2510
