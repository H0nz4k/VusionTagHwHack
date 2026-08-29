#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-064 / v0.11h — dump all four SRAM I2C blocks F8–FB (64 B).
 * One change vs v0.11g: poll F8,F9,FA,FB instead of only F8 + EEPROM 0x10.
 * Config RMW kept so a stock chip still enables SRAM_MIRROR; on this DEV
 * PRE is already 1B 00 10 48 (WR SKIP ALREADY). No EPD. --nooverlay.
 */

#define CFG_BLK          0x3Au
#define SRAM_BLK         0xF8u
#define EEP_MIRROR_BLK   0x10u  /* NFC page 0x40 */
#define NC_SRAM_MIRROR   0x02u
#define REG_LOCK_I2C     0x02u

static uint8_t cfg[16];
static uint8_t blk[16];

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

/* NXP EEPROM programming time ~4 ms after STOP. ~10 ms margin at 26 MHz. */
static void eeprom_wait(void)
{
    for (dly_a = 0u; dly_a < 4u; ++dly_a) {
        for (dly_b = 0u; dly_b < 20000u; ++dly_b) {
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

static void uart_hex16(const uint8_t *p)
{
    uint8_t i;

    for (i = 0u; i < 16u; ++i) {
        uart_hex8(p[i]);
        if (i < 15u) {
            uart_putc(' ');
        }
    }
}

static uint8_t i2c_read_block(uint8_t blk, uint8_t *dst)
{
    uint8_t ack_aa;
    uint8_t ack_blk;
    uint8_t ack_ab;
    uint8_t i;

    i2c_start();
    ack_aa = i2c_write(0xAAu);
    ack_blk = i2c_write(blk);
    i2c_start();
    ack_ab = i2c_write(0xABu);
    /* NXP: ACK all 16 data bytes, then STOP. */
    for (i = 0u; i < 16u; ++i) {
        dst[i] = i2c_read(1u);
    }
    i2c_stop();

    uart_puts(" ACKAA=");
    uart_hex8(ack_aa);
    uart_puts(" ACKBL=");
    uart_hex8(ack_blk);
    uart_puts(" ACKAB=");
    uart_hex8(ack_ab);
    uart_putc(' ');
    uart_hex16(dst);
    return (uint8_t)(ack_aa && ack_blk && ack_ab);
}

static uint8_t cfg_known_stock(void)
{
    return (uint8_t)(
        (cfg[0] == 0x19u) && (cfg[1] == 0x00u) && (cfg[2] == 0xF8u) &&
        (cfg[3] == 0x48u) && (cfg[4] == 0x08u) && (cfg[5] == 0x01u) &&
        (cfg[6] == 0x01u) && (cfg[7] == 0x00u));
}

static uint8_t cfg_already_target(void)
{
    return (uint8_t)(
        (cfg[0] == 0x1Bu) && (cfg[1] == 0x00u) && (cfg[2] == 0x10u) &&
        (cfg[3] == 0x48u) && (cfg[4] == 0x08u) && (cfg[5] == 0x01u) &&
        (cfg[6] == 0x01u) && (cfg[7] == 0x00u));
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t ack_aa;
    uint8_t ack_3a;
    uint8_t i;
    uint8_t n;
    uint8_t ok;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-064 v0.11h NFC-D SRAM64");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    P0SEL &= (unsigned char)~(BV(4) | BV(6));
    P0INP |= (uint8_t)(BV(4) | BV(6));
    sda_release();
    scl_release();

    uart_puts("PRE3A");
    ok = i2c_read_block(CFG_BLK, cfg);
    uart_crlf();

    if (!ok) {
        uart_puts("WR SKIP NOACK");
        uart_crlf();
    } else if ((cfg[6] & REG_LOCK_I2C) != 0u) {
        uart_puts("WR SKIP I2CLOCK");
        uart_crlf();
    } else if (cfg_already_target()) {
        uart_puts("WR SKIP ALREADY");
        uart_crlf();
    } else if (!cfg_known_stock()) {
        uart_puts("WR SKIP UNKNOWN ");
        uart_hex16(cfg);
        uart_crlf();
    } else {
        cfg[0] = (uint8_t)(cfg[0] | NC_SRAM_MIRROR);
        cfg[2] = EEP_MIRROR_BLK;
        /* bytes 1,3,4,5,6,7 and 8..15 kept from PRE */

        i2c_start();
        ack_aa = i2c_write(0xAAu);
        ack_3a = i2c_write(CFG_BLK);
        for (i = 0u; i < 16u; ++i) {
            blk[i] = i2c_write(cfg[i]);
        }
        i2c_stop();
        uart_puts("WR ACKAA=");
        uart_hex8(ack_aa);
        uart_puts(" ACK3A=");
        uart_hex8(ack_3a);
        uart_puts(" D=");
        uart_hex16(blk);
        uart_crlf();
        uart_puts("WR DATA ");
        uart_hex16(cfg);
        uart_crlf();
        eeprom_wait();
    }

    uart_puts("POST3A");
    (void)i2c_read_block(CFG_BLK, cfg);
    uart_crlf();

    n = 0u;
    while (1) {
        for (i = 0u; i < 4u; ++i) {
            uart_putc('S');
            uart_hex8(n);
            uart_putc(' ');
            uart_hex8((uint8_t)(SRAM_BLK + i));
            (void)i2c_read_block((uint8_t)(SRAM_BLK + i), blk);
            uart_crlf();
        }
        if (n == 0u) {
            uart_putc('E');
            uart_hex8(n);
            uart_puts(" 10");
            (void)i2c_read_block(EEP_MIRROR_BLK, blk);
            uart_crlf();
            uart_puts("DONE");
            uart_crlf();
        }
        n++;
        delay_crude();
    }
}
