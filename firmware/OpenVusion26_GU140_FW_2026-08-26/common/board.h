#ifndef OV26_BOARD_H
#define OV26_BOARD_H

#include <cc2510fx.h>
#include <stdint.h>

#define BV(n) ((uint8_t)(1u << (n)))

/*
 * OpenVusion 2.6 BWR GU140 candidate pin map.
 *
 * Confidence:
 *   HIGH:
 *     P0_0 EPD power (active low)
 *     P0_1 EPD CS
 *     P0_3 EPD MOSI
 *     P0_5 EPD SCLK
 *     P1_3 EPD BUSY
 *     P2_0 EPD RESET
 *
 *   MEDIUM/HIGH but MUST be proven on this exact board before v0.4/v0.5:
 *     P1_2 EPD D/C
 *
 *   Related-board mapping:
 *     P0_4 NFC SDA
 *     P0_6 NFC SCL
 *     P1_0 NFC/flash power
 *     P1_1 NFC FD
 *     P1_4 flash CS
 *     P1_5 flash SCLK
 *     P1_6 flash MOSI / temporary UART1 TX for diagnostics
 *     P1_7 flash MISO
 *
 *   NEVER scan/toggle:
 *     P2_3 / P2_4 = 32.768 kHz crystal on our measured GU140 board.
 */

#define EPD_PWR     P0_0
#define EPD_CS      P0_1
#define EPD_DC      P1_2
#define EPD_BUSY    P1_3
#define EPD_RESET   P2_0

#define FLASH_CS    P1_4

#define NFC_PWR     P1_0
#define NFC_FD      P1_1
#define NFC_SDA     P0_4
#define NFC_SCL     P0_6

#endif
