#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * v0.3k — register delta OFF / P2_1 / P2_2 / both.
 * Does not drive extra GPIO. P2_3/P2_4 untouched.
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

static void delay_hold(void)
{
    delay_crude();
    delay_crude();
    delay_crude();
    delay_crude();
    delay_crude();
}

static void dump_regs(void)
{
    uart_puts("P0=");
    uart_hex8(P0);
    uart_puts(" P1=");
    uart_hex8(P1);
    uart_puts(" P2=");
    uart_hex8(P2);
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
}

void main(void)
{
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P2SEL &= (uint8_t)~0x06u;
    P2_1 = 0;
    P2_2 = 0;
    P2DIR |= 0x06u;

    uart_crlf();
    uart_puts("OpenVusion GU140 v0.3k LED REGDUMP");
    uart_crlf();

    while (1) {
        P2_1 = 0;
        P2_2 = 0;
        uart_puts("STATE OFF");
        uart_crlf();
        dump_regs();
        delay_hold();

        P2_1 = 1;
        P2_2 = 0;
        uart_puts("STATE P2_1");
        uart_crlf();
        dump_regs();
        delay_hold();

        P2_1 = 0;
        P2_2 = 1;
        uart_puts("STATE P2_2");
        uart_crlf();
        dump_regs();
        delay_hold();

        P2_1 = 1;
        P2_2 = 1;
        uart_puts("STATE BOTH");
        uart_crlf();
        dump_regs();
        delay_hold();
    }
}
