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

static void print_busy(const char *label)
{
    uart_puts(label);
    uart_puts(" BUSY=");
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

    P0SEL &= (unsigned char)~(BV(0) | BV(1));
    EPD_PWR = 1;
    EPD_CS = 1;
    P0DIR |= (uint8_t)(BV(0) | BV(1));

    P2SEL &= (unsigned char)~BV(0);
    EPD_RESET = 0;
    P2DIR |= BV(0);

    uart_crlf();
    uart_puts("OpenVusion GU140 v0.3e RESET PROBE START");
    uart_crlf();

    print_busy("OFF/RST0");
    EPD_RESET = 1;
    delay_crude();
    print_busy("OFF/RST1");

    uart_puts("POWER ON");
    uart_crlf();
    EPD_PWR = 0;
    delay_crude();
    print_busy("ON/pre-reset");

    uart_puts("RESET H/L/H NOW");
    uart_crlf();
    EPD_RESET = 1;
    delay_crude();
    EPD_RESET = 0;
    delay_crude();
    EPD_RESET = 1;

    for (i = 0u; i < 12u; ++i) {
        delay_crude();
        uart_puts("sample ");
        uart_u16(i);
        uart_putc(' ');
        print_busy("");
    }

    EPD_RESET = 0;
    EPD_PWR = 1;
    EPD_CS = 1;
    uart_puts("DONE / safe shutdown");
    uart_crlf();

    while (1) {}
}
