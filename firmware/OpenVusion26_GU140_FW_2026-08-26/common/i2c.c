#include <cc2510fx.h>
#include <stdint.h>
#include "board.h"
#include "timebase.h"
#include "i2c.h"

/* Open-drain emulation: LOW = output 0, HIGH = release as input. */

static void tiny_delay(void)
{
    volatile uint8_t i;
    for (i = 0; i < 12u; ++i) {
        __asm
            nop
        __endasm;
    }
}

static void sda_low(void)
{
    NFC_SDA = 0;
    P0DIR |= BV(4);
}

static void sda_release(void)
{
    P0DIR &= (unsigned char)~BV(4);
}

static void scl_low(void)
{
    NFC_SCL = 0;
    P0DIR |= BV(6);
}

static void scl_release(void)
{
    P0DIR &= (unsigned char)~BV(6);
}

void i2c_init_p04_p06(void)
{
    P0SEL &= (unsigned char)~(BV(4) | BV(6));
    P0INP |= (uint8_t)(BV(4) | BV(6));
    sda_release();
    scl_release();
}

void i2c_start(void)
{
    sda_release();
    scl_release();
    tiny_delay();
    sda_low();
    tiny_delay();
    scl_low();
}

void i2c_stop(void)
{
    sda_low();
    tiny_delay();
    scl_release();
    tiny_delay();
    sda_release();
    tiny_delay();
}

uint8_t i2c_write(uint8_t value)
{
    uint8_t i;
    uint8_t ack;

    for (i = 0; i < 8u; ++i) {
        if (value & 0x80u) sda_release();
        else sda_low();

        tiny_delay();
        scl_release();
        tiny_delay();
        scl_low();
        value <<= 1;
    }

    sda_release();
    tiny_delay();
    scl_release();
    tiny_delay();
    ack = NFC_SDA ? 0u : 1u;
    scl_low();
    tiny_delay();

    return ack;
}
