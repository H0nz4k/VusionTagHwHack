#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-022 / v0.4a — Phase 1 passive BUSY.
 * P1_3 input only. No EPD drive. P0_2 untouched.
 * Locals stay in main() to avoid SDCC --model-small overlay.
 */

static void delay_crude(void)
{
    volatile uint8_t a;
    volatile uint16_t b;

    for (a = 0u; a < 18u; ++a) {
        for (b = 0u; b < 30000u; ++b) {
            __asm
                nop
            __endasm;
        }
    }
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t last;
    uint8_t n;
    uint8_t now;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);

    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~BV(3);
    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-022 v0.4a BUSY");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();
    uart_puts("P0DIR=");
    uart_hex8(P0DIR);
    uart_puts(" P1DIR=");
    uart_hex8(P1DIR);
    uart_puts(" P2DIR=");
    uart_hex8(P2DIR);
    uart_crlf();
    uart_puts("P0SEL=");
    uart_hex8(P0SEL);
    uart_puts(" P1SEL=");
    uart_hex8(P1SEL);
    uart_puts(" P2SEL=");
    uart_hex8(P2SEL);
    uart_puts(" PERCFG=");
    uart_hex8(PERCFG);
    uart_crlf();

    last = EPD_BUSY ? 1u : 0u;
    uart_puts("BUSY=");
    uart_putc(last ? '1' : '0');
    uart_crlf();

    n = 0u;
    while (1) {
        delay_crude();
        now = EPD_BUSY ? 1u : 0u;
        uart_puts("HB ");
        uart_hex8(n);
        uart_puts(" BUSY=");
        uart_putc(now ? '1' : '0');
        if (now != last) {
            uart_puts(" CHANGED");
            last = now;
        }
        uart_crlf();
        n++;
    }
}
