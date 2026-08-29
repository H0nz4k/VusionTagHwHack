#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-062 / v0.11f — I2C write config block 0x3A (not session 0xFE).
 * SRAM_MIRROR via 1B 00 40 48. One variable vs 059: word 0x3A.
 * No P1_0. No EEPROM. No EPD. P2_3/P2_4 untouched. --nooverlay.
 */

/* NC_REG|SRAM_MIRROR, LAST_NDEF, MIRROR_BLOCK 0x40, WDT_LS */
static const uint8_t cfg_e8[4] = { 0x1Bu, 0x00u, 0x40u, 0x48u };

static volatile uint8_t dly_a;
static volatile uint16_t dly_b;

static void delay_crude(void)
{
    for (dly_a = 0u; dly_a < 18u; ++dly_a) {
        for (dly_b = 0u; dly_b < 30000u; ++dly_b) {
            __asm
                nop
            __endasm;
        }
    }
}

static void i2c_pause(void)
{
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
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
    uint8_t n;

    P0DIR &= (unsigned char)~BV(6);
    n = 0u;
    while ((NFC_SCL == 0) && (n < 255u)) {
        n++;
    }
}

static void i2c_start(void)
{
    sda_release();
    scl_release();
    i2c_pause();
    sda_low();
    i2c_pause();
    scl_low();
}

static void i2c_stop(void)
{
    sda_low();
    i2c_pause();
    scl_release();
    i2c_pause();
    sda_release();
    i2c_pause();
}

static uint8_t i2c_write(uint8_t value)
{
    uint8_t i;
    uint8_t ack;

    for (i = 0u; i < 8u; ++i) {
        if (value & 0x80u) {
            sda_release();
        } else {
            sda_low();
        }
        i2c_pause();
        scl_release();
        i2c_pause();
        scl_low();
        value <<= 1;
    }
    sda_release();
    i2c_pause();
    scl_release();
    i2c_pause();
    ack = NFC_SDA ? 0u : 1u;
    scl_low();
    i2c_pause();
    return ack;
}

static uint8_t i2c_read(uint8_t send_ack)
{
    uint8_t i;
    uint8_t value;

    value = 0u;
    sda_release();
    for (i = 0u; i < 8u; ++i) {
        value <<= 1;
        i2c_pause();
        scl_release();
        i2c_pause();
        if (NFC_SDA) {
            value |= 1u;
        }
        scl_low();
    }
    if (send_ack) {
        sda_low();
    } else {
        sda_release();
    }
    i2c_pause();
    scl_release();
    i2c_pause();
    scl_low();
    sda_release();
    i2c_pause();
    return value;
}

static void dump_sram(uint8_t tag)
{
    uint8_t ack_aa;
    uint8_t ack_blk;
    uint8_t ack_ab;
    uint8_t i;
    uint8_t sram[8];

    i2c_start();
    ack_aa = i2c_write(0xAAu);
    ack_blk = i2c_write(0xF8u);
    i2c_start();
    ack_ab = i2c_write(0xABu);
    for (i = 0u; i < 8u; ++i) {
        sram[i] = i2c_read((uint8_t)(i < 7u));
    }
    i2c_stop();

    uart_putc('S');
    uart_hex8(tag);
    uart_puts(" ACKAA=");
    uart_hex8(ack_aa);
    uart_puts(" ACKF8=");
    uart_hex8(ack_blk);
    uart_puts(" ACKAB=");
    uart_hex8(ack_ab);
    uart_puts(" SRAM ");
    for (i = 0u; i < 8u; ++i) {
        uart_hex8(sram[i]);
        if (i < 7u) {
            uart_putc(' ');
        }
    }
    uart_crlf();
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t ack_aa;
    uint8_t ack_3a;
    uint8_t ack_d[4];
    uint8_t i;
    uint8_t n;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-062 v0.11f NFC-D CFG3A");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    P0SEL &= (unsigned char)~(BV(4) | BV(6));
    P0INP |= (uint8_t)(BV(4) | BV(6));
    sda_release();
    scl_release();

    dump_sram(0u);

    i2c_start();
    ack_aa = i2c_write(0xAAu);
    ack_3a = i2c_write(0x3Au);
    for (i = 0u; i < 4u; ++i) {
        ack_d[i] = i2c_write(cfg_e8[i]);
    }
    i2c_stop();

    uart_puts("CFG3A ACKAA=");
    uart_hex8(ack_aa);
    uart_puts(" ACK3A=");
    uart_hex8(ack_3a);
    uart_puts(" D=");
    for (i = 0u; i < 4u; ++i) {
        uart_hex8(ack_d[i]);
        if (i < 3u) {
            uart_putc(' ');
        }
    }
    uart_crlf();

    n = 1u;
    while (n < 9u) {
        delay_crude();
        dump_sram(n);
        n++;
    }
    uart_puts("DONE");
    uart_crlf();
    while (1) {}
}
