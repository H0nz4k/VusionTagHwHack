#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"
#include "img_rle.h"

/*
 * EXP-056 / v0.10g — SHOW 1–3 plus 4 blank; slot 3 = TagStudio 2026-08-28_22-28-47.
 * CoG/SPI = v0.4k/v0.4l. Debugger isolated. P2_3/P2_4, P0_2 off.
 */

#define PLANE     5624u
#define CMD_BLK   0x0Cu
#define LOCK_BLK  0x38u
#define I2C_W     0xAAu
#define I2C_R     0xABu

static volatile uint8_t dly_a;
static volatile uint16_t dly_b;
static volatile uint16_t spi_spins;
static uint8_t uploading;
static uint8_t led;
static uint8_t lockbuf[16];

static void delay_250(void)
{
    for (dly_a = 0u; dly_a < 9u; ++dly_a) {
        for (dly_b = 0u; dly_b < 30000u; ++dly_b) {
            __asm
                nop
            __endasm;
        }
    }
    if (uploading) {
        led ^= 1u;
        P2_1 = led;
        P2_2 = led;
    }
}

static void delay_crude(void)
{
    delay_250();
    delay_250();
}

static uint8_t spi_tx(uint8_t v)
{
    spi_spins = 0u;
    U0CSR &= (unsigned char)~0x02u;
    U0DBUF = v;
    while (!(U0CSR & 0x02u)) {
        spi_spins++;
        if (spi_spins == 0u) {
            return 0u;
        }
    }
    U0CSR &= (unsigned char)~0x02u;
    return 1u;
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

static void i2c_prep(void)
{
    P0SEL &= (unsigned char)~(BV(4) | BV(6));
    P0INP |= (uint8_t)(BV(4) | BV(6));
    sda_release();
    scl_release();
}

static uint8_t nfc_unlock_dynlock(void)
{
    uint8_t i;
    uint8_t ack;

    i2c_prep();
    i2c_start();
    ack = i2c_write(I2C_W);
    ack = (uint8_t)(ack && i2c_write(LOCK_BLK));
    i2c_start();
    ack = (uint8_t)(ack && i2c_write(I2C_R));
    if (!ack) {
        i2c_stop();
        uart_puts("UNLOCK RD NACK");
        uart_crlf();
        return 0u;
    }
    for (i = 0u; i < 15u; ++i) {
        lockbuf[i] = i2c_read(1u);
    }
    lockbuf[15] = i2c_read(0u);
    i2c_stop();

    uart_puts("E2=");
    uart_hex8(lockbuf[8]);
    uart_hex8(lockbuf[9]);
    uart_hex8(lockbuf[10]);
    uart_hex8(lockbuf[11]);
    uart_crlf();

    if ((lockbuf[8] == 0u) && (lockbuf[9] == 0u) && (lockbuf[10] == 0u)) {
        uart_puts("UNLOCK already");
        uart_crlf();
        return 1u;
    }

    lockbuf[8] = 0u;
    lockbuf[9] = 0u;
    lockbuf[10] = 0u;
    lockbuf[11] = 0u;

    i2c_start();
    ack = i2c_write(I2C_W);
    ack = (uint8_t)(ack && i2c_write(LOCK_BLK));
    for (i = 0u; i < 16u; ++i) {
        ack = (uint8_t)(ack && i2c_write(lockbuf[i]));
    }
    i2c_stop();
    delay_crude();

    uart_puts("UNLOCK WR=");
    uart_hex8(ack);
    uart_crlf();
    return ack;
}

static uint8_t nfc_read_variant(uint8_t *out)
{
    uint8_t ack_aa;
    uint8_t ack_blk;
    uint8_t ack_ab;
    uint8_t b0;
    uint8_t b1;
    uint8_t b2;
    uint8_t b3;

    i2c_prep();
    i2c_start();
    ack_aa = i2c_write(I2C_W);
    ack_blk = i2c_write(CMD_BLK);
    i2c_start();
    ack_ab = i2c_write(I2C_R);
    b0 = i2c_read(1u);
    b1 = i2c_read(1u);
    b2 = i2c_read(1u);
    b3 = i2c_read(0u);
    i2c_stop();
    uart_puts("ACKAB=");
    uart_hex8(ack_ab);
    uart_puts(" CMD=");
    uart_hex8(b0);
    uart_hex8(b1);
    uart_hex8(b2);
    uart_hex8(b3);
    uart_crlf();
    if (ack_aa && ack_blk && ack_ab && (b0 == 0x4Fu) && (b1 == 0x56u) && (b2 == 0x48u) && (b3 >= 1u) && (b3 <= 4u)) {
        *out = b3;
        return 1u;
    }
    return 0u;
}

static uint8_t rle_left;
static uint8_t rle_val;
static uint16_t rle_i;
static const unsigned char *rle_p;

static void rle_open(const unsigned char *p)
{
    rle_p = p;
    rle_i = 0u;
    rle_left = 0u;
    rle_val = 0u;
}

static uint8_t rle_byte(void)
{
    if (rle_left == 0u) {
        rle_left = rle_p[rle_i];
        rle_i++;
        rle_val = rle_p[rle_i];
        rle_i++;
    }
    rle_left--;
    return rle_val;
}

static uint8_t stream_plane(uint8_t cmd, const unsigned char *rle)
{
    uint16_t left;
    uint8_t ok;

    rle_open(rle);
    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(cmd);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    left = PLANE;
    while (ok && left) {
        if (!spi_tx(rle_byte())) {
            ok = 0u;
        } else {
            left--;
        }
    }
    EPD_CS = 1;
    return ok;
}

static uint8_t stream_zero_plane(uint8_t cmd)
{
    uint16_t left;
    uint8_t ok;

    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(cmd);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    left = PLANE;
    while (ok && left) {
        if (!spi_tx(0u)) {
            ok = 0u;
        } else {
            left--;
        }
    }
    EPD_CS = 1;
    return ok;
}

static void epd_refresh(uint8_t variant)
{
    uint8_t ok;
    const unsigned char *p10;
    const unsigned char *p13;

    p10 = ovh_rle10;
    p13 = ovh_rle13;
    if (variant == 2u) {
        p10 = tst_rle10;
        p13 = tst_rle13;
    } else if (variant == 3u) {
        p10 = su_rle10;
        p13 = su_rle13;
    }

    delay_crude();
    EPD_PWR = 0;
    EPD_RESET = 1;
    P2DIR |= BV(0);
    delay_crude();
    EPD_RESET = 0;
    delay_crude();
    delay_crude();
    EPD_RESET = 1;
    EPD_CS = 1;
    P0DIR |= BV(1);
    delay_crude();
    PERCFG &= (unsigned char)~0x01u;
    U0CSR = 0x00u;
    U0GCR = (unsigned char)(BV(5) | 17u);
    U0BAUD = 0u;
    P0DIR |= (unsigned char)(BV(3) | BV(5));
    P0SEL |= (unsigned char)(BV(3) | BV(5));

    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0x00u);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x0Eu);
    }
    EPD_CS = 1;
    delay_crude();
    EPD_DC = 0;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0xE5u);
    }
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x19u);
    }
    EPD_CS = 1;
    EPD_DC = 0;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0xE0u);
    }
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x02u);
    }
    EPD_CS = 1;
    EPD_DC = 0;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x00u);
    }
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0xCFu);
    }
    if (ok) {
        ok = spi_tx(0x8Du);
    }
    EPD_CS = 1;
    uart_puts("INIT=");
    uart_hex8(ok);
    uart_crlf();

    if (variant == 4u) {
        ok = stream_zero_plane(0x10u);
    } else {
        ok = stream_plane(0x10u, p10);
    }
    uart_puts("P10=");
    uart_hex8(ok);
    uart_crlf();
    if (variant == 4u) {
        ok = stream_zero_plane(0x13u);
    } else {
        ok = stream_plane(0x13u, p13);
    }
    uart_puts("P13=");
    uart_hex8(ok);
    uart_crlf();

    EPD_DC = 0;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x04u);
    }
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x00u);
    }
    EPD_CS = 1;
    delay_crude();
    EPD_DC = 0;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x12u);
    }
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x00u);
    }
    EPD_CS = 1;
    uart_puts("REF=");
    uart_hex8(ok);
    uart_crlf();
}

static uint8_t wait_fd_pulse(void)
{
    uint8_t saw;

    while (1) {
        saw = 0u;
        for (dly_a = 0u; dly_a < 9u; ++dly_a) {
            for (dly_b = 0u; dly_b < 30000u; ++dly_b) {
                if (!NFC_FD) {
                    saw = 1u;
                }
                __asm
                    nop
                __endasm;
            }
        }
        if (saw) {
            return 1u;
        }
        uart_puts("WAIT LED=00");
        uart_crlf();
    }
}

static void wait_field_gone(void)
{
    uint8_t saw;
    uint8_t quiet;

    quiet = 0u;
    while (quiet < 2u) {
        saw = 0u;
        for (dly_a = 0u; dly_a < 9u; ++dly_a) {
            for (dly_b = 0u; dly_b < 30000u; ++dly_b) {
                if (!NFC_FD) {
                    saw = 1u;
                }
                __asm
                    nop
                __endasm;
            }
        }
        if (saw) {
            quiet = 0u;
        } else {
            quiet++;
        }
    }
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t variant;
    uint8_t got;
    uint8_t tries;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~(BV(1) | BV(2) | BV(3));
    P1DIR &= (unsigned char)~(BV(1) | BV(3));
    P1INP |= BV(3);
    EPD_DC = 1;
    P1DIR |= BV(2);
    P0SEL &= (unsigned char)~BV(0);
    EPD_PWR = 1;
    P0DIR |= BV(0);

    P2SEL &= (uint8_t)~0x06u;
    P2_1 = 0;
    P2_2 = 0;
    P2DIR |= 0x06u;
    uploading = 0u;
    led = 0u;
    i2c_prep();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-056 v0.10g NFC SHOW4");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();
    nfc_unlock_dynlock();

    while (1) {
        uart_puts("ARMED");
        uart_crlf();
        wait_fd_pulse();
        uart_puts("GOT");
        uart_crlf();
        uploading = 1u;
        led = 1u;
        P2_1 = 1;
        P2_2 = 1;
        got = 0u;
        variant = 0u;
        tries = 0u;
        while (tries < 12u) {
            if (nfc_read_variant(&variant)) {
                got = 1u;
                break;
            }
            delay_250();
            tries++;
        }
        uploading = 0u;
        led = 0u;
        P2_1 = 0;
        P2_2 = 0;
        uart_puts("LATCH=");
        uart_hex8(got);
        uart_puts(" VAR=");
        uart_hex8(variant);
        uart_crlf();
        if (got) {
            epd_refresh(variant);
            uart_puts("DONE");
            uart_crlf();
        }
        wait_field_gone();
    }
}
