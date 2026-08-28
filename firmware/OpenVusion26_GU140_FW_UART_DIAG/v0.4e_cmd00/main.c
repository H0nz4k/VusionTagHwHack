#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-026 / v0.4e — Phase E: command 0x00 + data 0x0E only.
 * PWR ON, H-L-H, wait BUSY HIGH, SPI idle, then one soft-reset pair.
 * No 0x12, no framebuffer. P0_2 untouched. Bounded SPI TX wait.
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

static void dump_regs(void)
{
    uart_puts("P0=");
    uart_hex8(P0);
    uart_puts(" P0DIR=");
    uart_hex8(P0DIR);
    uart_puts(" P0SEL=");
    uart_hex8(P0SEL);
    uart_crlf();
    uart_puts("P1DIR=");
    uart_hex8(P1DIR);
    uart_puts(" P1SEL=");
    uart_hex8(P1SEL);
    uart_crlf();
    uart_puts("PERCFG=");
    uart_hex8(PERCFG);
    uart_puts(" U0CSR=");
    uart_hex8(U0CSR);
    uart_crlf();
    uart_puts("BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_puts(" CS=");
    uart_putc(EPD_CS ? '1' : '0');
    uart_puts(" DC=");
    uart_putc(EPD_DC ? '1' : '0');
    uart_crlf();
}

static void dump_chk(void)
{
    uart_puts("CHK P0_2SEL=");
    uart_putc((P0SEL & BV(2)) ? '1' : '0');
    uart_puts(" P0_2DIR=");
    uart_putc((P0DIR & BV(2)) ? '1' : '0');
    uart_puts(" CS=");
    uart_putc(EPD_CS ? '1' : '0');
    uart_crlf();
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t n;
    uint8_t waited;
    uint8_t tx0;
    uint8_t tx1;
    uint8_t saw0;
    uint8_t saw1;

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
    uart_puts("OpenVusion GU140 EXP-026 v0.4e CMD");
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

    waited = 0u;
    n = 0u;
    while (n < 8u) {
        if (EPD_BUSY) {
            waited = 1u;
            break;
        }
        delay_crude();
        n++;
    }

    uart_puts("WAIT ");
    if (waited) {
        uart_puts("OK n=");
    } else {
        uart_puts("TO n=");
    }
    uart_hex8(n);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    EPD_CS = 1;
    P0DIR |= BV(1);

    PERCFG &= (unsigned char)~0x01u;
    U0CSR = 0x00u;
    U0GCR = (unsigned char)(BV(5) | 17u);
    U0BAUD = 0u;
    P0DIR |= (unsigned char)(BV(3) | BV(5));
    P0SEL |= (unsigned char)(BV(3) | BV(5));

    uart_puts("PRECMD");
    uart_crlf();
    dump_regs();
    dump_chk();

    uart_puts("TX 00");
    uart_crlf();
    EPD_DC = 0;
    EPD_CS = 0;
    tx0 = spi_tx(0x00u);
    EPD_CS = 1;
    EPD_DC = 1;
    uart_puts("TX0=");
    uart_hex8(tx0);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    uart_puts("TX 0E");
    uart_crlf();
    EPD_CS = 0;
    tx1 = spi_tx(0x0Eu);
    EPD_CS = 1;
    uart_puts("TX1=");
    uart_hex8(tx1);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    saw0 = 0u;
    saw1 = 0u;
    n = 0u;
    while (n < 12u) {
        if (EPD_BUSY) {
            saw1 = 1u;
        } else {
            saw0 = 1u;
        }
        uart_puts("S ");
        uart_hex8(n);
        uart_puts(" BUSY=");
        uart_putc(EPD_BUSY ? '1' : '0');
        uart_puts(" CS=");
        uart_putc(EPD_CS ? '1' : '0');
        uart_crlf();
        delay_crude();
        n++;
    }

    uart_puts("SAW0=");
    uart_hex8(saw0);
    uart_puts(" SAW1=");
    uart_hex8(saw1);
    uart_crlf();

    uart_puts("POST");
    uart_crlf();
    dump_regs();
    dump_chk();

    uart_puts("DONE");
    uart_crlf();

    n = 0u;
    while (1) {
        delay_crude();
        uart_puts("HB ");
        uart_hex8(n);
        uart_puts(" BUSY=");
        uart_putc(EPD_BUSY ? '1' : '0');
        uart_puts(" CS=");
        uart_putc(EPD_CS ? '1' : '0');
        uart_crlf();
        n++;
    }
}
