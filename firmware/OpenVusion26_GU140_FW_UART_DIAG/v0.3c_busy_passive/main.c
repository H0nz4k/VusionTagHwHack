#include <cc2510fx.h>
#include <stdint.h>
#include "board.h"
#include "clock.h"
#include "uart1.h"

static void delay_crude(void)
{
    volatile uint8_t a;
    volatile uint16_t b;
    for (a = 0; a < 18u; ++a) {
        for (b = 0; b < 30000u; ++b) {
            __asm
                nop
            __endasm;
        }
    }
}

void main(void)
{
    uint8_t last;
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~BV(3);
    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);

    uart_crlf();
    uart_puts("OpenVusion GU140 v0.3c PASSIVE BUSY START");
    uart_crlf();

    last = EPD_BUSY ? 1u : 0u;
    uart_puts("BUSY=");
    uart_putc(last ? '1' : '0');
    uart_crlf();

    while (1) {
        uint8_t now = EPD_BUSY ? 1u : 0u;
        if (now != last) {
            uart_puts("BUSY CHANGED -> ");
            uart_putc(now ? '1' : '0');
            uart_crlf();
            last = now;
        }
        delay_crude();
    }
}
