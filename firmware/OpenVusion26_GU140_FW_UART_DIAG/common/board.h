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
#endif
