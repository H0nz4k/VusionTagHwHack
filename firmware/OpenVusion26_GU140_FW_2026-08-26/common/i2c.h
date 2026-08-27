#ifndef OV26_I2C_H
#define OV26_I2C_H

#include <stdint.h>

void i2c_init_p04_p06(void);
void i2c_start(void);
void i2c_stop(void);
uint8_t i2c_write(uint8_t value);

#endif
