#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-041 / v0.6c — UART control after two NFC I2C UART-FAIL images.
 * No P0_4/P0_6, no P1_0. Same clock+uart+delay_crude as v0.5a.
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

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-041 v0.6c NFC UART");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    n = 0u;
    while (n < 3u) {
        delay_crude();
        uart_puts("HB ");
        uart_hex8(n);
        uart_crlf();
        n++;
    }
    uart_puts("DONE");
    uart_crlf();
    while (1) {}
}
