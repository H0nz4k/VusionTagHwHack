#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-027 / v0.4f — min init. Flattened like working v0.4e (UART).
 * register_data_sm: 00 0E, E5 19, E0 02, 00 CF 8D.
 */

static volatile uint8_t dly_a;
static volatile uint16_t dly_b;
static volatile uint16_t spi_spins;

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

void main(void)
{
    uint8_t reset_cause;
    uint8_t n;
    uint8_t ok;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~(BV(2) | BV(3));
    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);
    EPD_DC = 1;
    P1DIR |= BV(2);

    P0SEL &= (unsigned char)~BV(0);
    EPD_PWR = 1;
    P0DIR |= BV(0);

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-027 v0.4f INIT");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    delay_crude();
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

    uart_puts("W1 BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    uart_puts("SR");
    uart_crlf();
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
    uart_puts("SR=");
    uart_hex8(ok);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();
    delay_crude();

    uart_puts("E5");
    uart_crlf();
    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0xE5u);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x19u);
    }
    EPD_CS = 1;
    uart_puts("E5=");
    uart_hex8(ok);
    uart_crlf();

    uart_puts("E0");
    uart_crlf();
    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0xE0u);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x02u);
    }
    EPD_CS = 1;
    uart_puts("E0=");
    uart_hex8(ok);
    uart_crlf();

    uart_puts("PSR");
    uart_crlf();
    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0x00u);
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
    uart_puts("PSR=");
    uart_hex8(ok);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    uart_puts("CHK P0_2SEL=");
    uart_putc((P0SEL & BV(2)) ? '1' : '0');
    uart_puts(" CS=");
    uart_putc(EPD_CS ? '1' : '0');
    uart_crlf();
    uart_puts("DONE");
    uart_crlf();

    n = 0u;
    while (1) {
        delay_crude();
        uart_puts("HB ");
        uart_hex8(n);
        uart_puts(" BUSY=");
        uart_putc(EPD_BUSY ? '1' : '0');
        uart_crlf();
        n++;
    }
}
