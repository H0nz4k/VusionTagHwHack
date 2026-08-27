#include <cc2510fx.h>
#include <stdint.h>
#include "board.h"
#include "timebase.h"
#include "epd.h"

static void spi0_tx(uint8_t v)
{
    U0CSR &= (unsigned char)~0x02u;   /* clear TX_BYTE */
    U0DBUF = v;
    while (!(U0CSR & 0x02u)) {
    }
    U0CSR &= (unsigned char)~0x02u;
}

void epd_bus_init(void)
{
    /*
     * Safe software-controlled lines first.
     * P1_2 = D/C is the one mapping that MUST be confirmed before this code
     * is flashed to the exact GU140 board.
     */
    P0SEL &= (unsigned char)~(BV(0) | BV(1));
    P1SEL &= (unsigned char)~(BV(2) | BV(3));
    P2SEL &= (unsigned char)~BV(0);

    EPD_PWR = 1;       /* active-low board power -> OFF */
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_RESET = 0;

    P0DIR |= (uint8_t)(BV(0) | BV(1));
    P1DIR |= BV(2);
    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);    /* BUSY as high-Z input */
    P2DIR |= BV(0);

    /*
     * USART0 Alternative 1 in SPI master mode.
     * VUSION reference firmware uses P0_3=MOSI and P0_5=SCLK.
     * 26 MHz with BAUD_E=17, BAUD_M=0 gives the known fast SPI setting.
     */
    PERCFG &= (unsigned char)~0x01u;
    U0CSR = 0x00u;                 /* SPI master */
    U0GCR = (uint8_t)(BV(5) | 17u); /* MSB first, mode 0, BAUD_E=17 */
    U0BAUD = 0u;
    U0CSR |= 0x40u;                /* enable SPI */
    P0SEL |= (uint8_t)(BV(3) | BV(5));
}

void epd_power_off_gpio(void) { EPD_PWR = 1; }
void epd_power_on_gpio(void)  { EPD_PWR = 0; }
void epd_reset_low(void)      { EPD_RESET = 0; }
void epd_reset_high(void)     { EPD_RESET = 1; }
uint8_t epd_busy(void)        { return EPD_BUSY ? 1u : 0u; }

void epd_hard_reset(void)
{
    /* Pervasive reference reset shape, with conservative timing. */
    EPD_RESET = 1;
    delay_ms(5);
    EPD_RESET = 0;
    delay_ms(10);
    EPD_RESET = 1;
    delay_ms(5);
    EPD_CS = 1;
    delay_ms(5);
}

uint8_t epd_wait_ready(uint16_t timeout_ms)
{
    uint32_t start = time_ms();
    while (!epd_busy()) {
        if ((uint32_t)(time_ms() - start) >= (uint32_t)timeout_ms) {
            return 0u;
        }
    }
    return 1u;
}

void epd_send_cmd(uint8_t cmd)
{
    EPD_DC = 0;
    EPD_CS = 0;
    spi0_tx(cmd);
    EPD_CS = 1;
    EPD_DC = 1;
}

void epd_send_cmd_data1(uint8_t cmd, uint8_t d0)
{
    epd_send_cmd(cmd);
    EPD_CS = 0;
    spi0_tx(d0);
    EPD_CS = 1;
}

void epd_send_cmd_data2(uint8_t cmd, uint8_t d0, uint8_t d1)
{
    epd_send_cmd(cmd);
    EPD_CS = 0;
    spi0_tx(d0);
    spi0_tx(d1);
    EPD_CS = 1;
}

void epd_begin_stream(uint8_t cmd)
{
    epd_send_cmd(cmd);
    EPD_CS = 0;
}

void epd_stream_byte(uint8_t value)
{
    spi0_tx(value);
}

void epd_end_stream(void)
{
    EPD_CS = 1;
}

uint8_t epd_cog_init_266(void)
{
    /*
     * Official Pervasive GU-small sequence for non-4.2" panels:
     * register_data_sm = {00, 0E, 19, 02, CF, 8D}
     */
    epd_power_on_gpio();
    delay_ms(5);
    epd_hard_reset();

    epd_send_cmd_data1(0x00u, 0x0Eu);  /* soft reset */
    if (!epd_wait_ready(3000u)) return 0u;

    epd_send_cmd_data1(0xE5u, 0x19u);  /* 25 C */
    epd_send_cmd_data1(0xE0u, 0x02u);  /* active temperature */
    epd_send_cmd_data2(0x00u, 0xCFu, 0x8Du); /* PSR */

    return 1u;
}

uint8_t epd_cog_power_off(void)
{
    epd_send_cmd(0x02u);               /* turn off DC/DC */
    if (!epd_wait_ready(5000u)) {
        epd_reset_low();
        delay_ms(150u);
        epd_power_off_gpio();
        return 0u;
    }

    EPD_DC = 0;
    EPD_CS = 0;
    delay_ms(150u);
    epd_reset_low();
    epd_power_off_gpio();
    return 1u;
}
