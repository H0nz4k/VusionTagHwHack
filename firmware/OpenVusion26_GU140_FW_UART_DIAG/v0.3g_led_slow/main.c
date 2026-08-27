#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/* v0.3g — v0.3f plus longer holds. No nested delay loop (SDCC overlay). */

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

static void delay_gap(void)
{
    delay_crude();
    delay_crude();
}

static void led_state(uint8_t p21, uint8_t p22)
{
    P2_1 = p21;
    P2_2 = p22;
    uart_puts("LED P2_1=");
    uart_putc(p21 ? '1' : '0');
    uart_puts(" P2_2=");
    uart_putc(p22 ? '1' : '0');
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
    uart_puts("OpenVusion GU140 v0.3g LED SLOW");
    uart_crlf();

    while (1) {
        P2_1 = 0;
        P2_2 = 0;
        uart_puts("OFF");
        uart_crlf();
        delay_gap();

        led_state(0, 0);
        delay_hold();
        P2_1 = 0;
        P2_2 = 0;
        delay_gap();

        led_state(1, 0);
        delay_hold();
        P2_1 = 0;
        P2_2 = 0;
        delay_gap();

        led_state(0, 1);
        delay_hold();
        P2_1 = 0;
        P2_2 = 0;
        delay_gap();

        led_state(1, 1);
        delay_hold();
    }
}
