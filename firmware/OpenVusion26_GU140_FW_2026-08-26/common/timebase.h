#ifndef OV26_TIMEBASE_H
#define OV26_TIMEBASE_H

#include <stdint.h>

void timebase_init(void);
uint32_t time_ms(void);
void delay_ms(uint16_t ms);

#endif
