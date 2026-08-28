#ifndef OV26_BOARD_H
#define OV26_BOARD_H
#include <cc2510fx.h>
#include <stdint.h>
#define BV(n) ((uint8_t)(1u << (n)))
#define EPD_PWR     P0_0
#define EPD_CS      P0_1
#define EPD_DC      P1_2
#define EPD_BUSY    P1_3
#define EPD_RESET   P2_0
#define FLASH_CS    P1_4
/* NFC I²C: P0_4 SDA / P0_6 SCL — OVĚŘENO EXP-040 ACK of 0xAA.
 * P1_0 NFC power / P1_1 FD still REFERENCE (not required for ACK). */
#define NFC_PWR     P1_0
#define NFC_FD      P1_1
#define NFC_SDA     P0_4
#define NFC_SCL     P0_6
#endif
