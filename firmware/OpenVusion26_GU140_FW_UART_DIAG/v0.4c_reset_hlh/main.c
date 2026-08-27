#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-024 / v0.4c — EPD_PWR ON, P2_0 HIGH-LOW-HIGH.
 * Compact strings (--nooverlay). No P2SEL. No SPI/DC/CS. No 0x00/0x0E.
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

void main(void)
{
    uint8_t reset_cause;
    uint8_t n;
    uint8_t busy;

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
    uart_puts("OpenVusion GU140 EXP-024 v0.4c RST");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    uart_puts("PRE PWR_OFF BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    delay_crude();
    delay_crude();

    EPD_PWR = 0;
    uart_puts("PRE RST BUSY=");
    busy = EPD_BUSY ? 1u : 0u;
    uart_putc(busy ? '1' : '0');
    uart_crlf();

    EPD_RESET = 1;
    P2DIR |= BV(0);
    uart_puts("RST H BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();
    delay_crude();

    EPD_RESET = 0;
    uart_puts("RST L BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();
    delay_crude();
    delay_crude();

    EPD_RESET = 1;
    uart_puts("RST H2 BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    n = 1u;
    while (n < 6u) {
        delay_crude();
        busy = EPD_BUSY ? 1u : 0u;
        uart_puts("S ");
        uart_hex8(n);
        uart_puts(" BUSY=");
        uart_putc(busy ? '1' : '0');
        uart_crlf();
        n++;
    }

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
