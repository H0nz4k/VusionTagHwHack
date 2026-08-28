#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-025 / v0.4d — Phase D SPI idle only.
 * PWR ON, P2_0 H-L-H, wait P1_3 HIGH, USART0 Alt1 MOSI/SCLK, CS=1.
 * No U0DBUF. No 0x00/0x0E. P0_2 not selected, not driven. No DC.
 */

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

static void dump_regs(void)
{
    uart_puts("P0=");
    uart_hex8(P0);
    uart_puts(" P0DIR=");
    uart_hex8(P0DIR);
    uart_puts(" P0SEL=");
    uart_hex8(P0SEL);
    uart_crlf();
    uart_puts("PERCFG=");
    uart_hex8(PERCFG);
    uart_puts(" U0CSR=");
    uart_hex8(U0CSR);
    uart_puts(" U0GCR=");
    uart_hex8(U0GCR);
    uart_puts(" U0BAUD=");
    uart_hex8(U0BAUD);
    uart_crlf();
    uart_puts("BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_puts(" CS=");
    uart_putc(EPD_CS ? '1' : '0');
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
    uart_puts(" P0SEL3=");
    uart_putc((P0SEL & BV(3)) ? '1' : '0');
    uart_puts(" P0SEL5=");
    uart_putc((P0SEL & BV(5)) ? '1' : '0');
    uart_crlf();
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t n;
    uint8_t waited;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);

    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~BV(3);
    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);

    P0SEL &= (unsigned char)~BV(0);
    EPD_PWR = 1;
    P0DIR |= BV(0);

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-025 v0.4d SPI");
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

    uart_puts("PRE");
    uart_crlf();
    dump_regs();
    dump_chk();

    /* CS GPIO HIGH / inactive. Do not send a byte. Do not touch P0_2. */
    EPD_CS = 1;
    P0DIR |= BV(1);

    PERCFG &= (unsigned char)~0x01u;
    U0CSR = 0x00u;
    U0GCR = (unsigned char)(BV(5) | 17u);
    U0BAUD = 0u;
    P0DIR |= (unsigned char)(BV(3) | BV(5));
    P0SEL |= (unsigned char)(BV(3) | BV(5));

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
