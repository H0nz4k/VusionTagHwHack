#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * v0.3h — named LED holds from EXP-017 human order:
 * first active = RGB (P2_1=1 P2_2=0), later = white (P2_2=1).
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
    delay_crude();
}

static void delay_gap(void)
{
    delay_crude();
    delay_crude();
}

static void all_off(void)
{
    P2_1 = 0;
    P2_2 = 0;
    uart_puts("OFF");
    uart_crlf();
    delay_gap();
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
    uart_puts("OpenVusion GU140 v0.3h LED RGB/WHITE");
    uart_crlf();

    while (1) {
        all_off();
        P2_1 = 1;
        P2_2 = 0;
        uart_puts("RGB  P2_1=1 P2_2=0");
        uart_crlf();
        delay_hold();

        all_off();
        P2_1 = 0;
        P2_2 = 1;
        uart_puts("WHITE P2_1=0 P2_2=1");
        uart_crlf();
        delay_hold();

        all_off();
        P2_1 = 1;
        P2_2 = 1;
        uart_puts("BOTH P2_1=1 P2_2=1");
        uart_crlf();
        delay_hold();
    }
}
