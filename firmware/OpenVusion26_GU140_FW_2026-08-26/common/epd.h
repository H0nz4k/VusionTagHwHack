#ifndef OV26_EPD_H
#define OV26_EPD_H

#include <stdint.h>

/* Candidate GU140 E2266JS0C2 interface. Use only after v0.3 validation. */

void epd_bus_init(void);
void epd_power_off_gpio(void);
void epd_power_on_gpio(void);
void epd_reset_low(void);
void epd_reset_high(void);
uint8_t epd_busy(void);

void epd_hard_reset(void);
uint8_t epd_wait_ready(uint16_t timeout_ms);

void epd_send_cmd(uint8_t cmd);
void epd_send_cmd_data1(uint8_t cmd, uint8_t d0);
void epd_send_cmd_data2(uint8_t cmd, uint8_t d0, uint8_t d1);

void epd_begin_stream(uint8_t cmd);
void epd_stream_byte(uint8_t value);
void epd_end_stream(void);

uint8_t epd_cog_init_266(void);
uint8_t epd_cog_power_off(void);

#endif
