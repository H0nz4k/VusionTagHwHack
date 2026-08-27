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

static void print_busy(void)
{
    uart_puts("BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();
}
void main(void)
{
    uint8_t i;
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~BV(3);
    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);

    P0SEL &= (unsigned char)~BV(0);
    EPD_PWR = 1;
    P0DIR |= BV(0);

    uart_crlf();
    uart_puts("OpenVusion GU140 v0.3d POWER ONLY START");
    uart_crlf();
    uart_puts("PWR OFF ");
    print_busy();

    delay_crude();

    uart_puts("POWER ON NOW");
    uart_crlf();
    EPD_PWR = 0;

    for (i = 0u; i < 12u; ++i) {
        delay_crude();
        uart_puts("sample ");
        uart_u16(i);
        uart_putc(' ');
        print_busy();
    }

    uart_puts("POWER OFF NOW");
    uart_crlf();
    EPD_PWR = 1;
    uart_puts("DONE");
    uart_crlf();

    while (1) {}
}
