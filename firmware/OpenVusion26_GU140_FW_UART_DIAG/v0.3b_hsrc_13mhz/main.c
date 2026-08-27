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
    uint8_t reset_cause;
    uint8_t clkcon_after;
    uint8_t sleep_after;

    /*
     * SLEEP.RST must be captured immediately.
     *
     * 0 = POR / brown-out
     * 1 = external RESET_N
     * 2 = watchdog
     */
    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);

    clock_init_hsrc_13mhz();
    clkcon_after = CLKCON;
    sleep_after = SLEEP;

    /* BAUD_E=13, BAUD_M=34 @ 13 MHz -> ~115200 */
    uart1_init_115200_alt2_tx_p16_baud_e(13u);

    uart_crlf();
    uart_puts("OpenVusion GU140 RESET CAUSE TEST");
    uart_crlf();
    uart_puts("CLOCK=13MHZ_HSRC");
    uart_crlf();
    uart_puts("CLKCON=0x");
    uart_hex8(clkcon_after);
    uart_puts(" SLEEP=0x");
    uart_hex8(sleep_after);
    uart_crlf();

    uart_puts("RESET_CAUSE=");

    if (reset_cause == 0u) {
        uart_puts("0 POR/BROWNOUT");
    } else if (reset_cause == 1u) {
        uart_puts("1 EXTERNAL_RESET_N");
    } else if (reset_cause == 2u) {
        uart_puts("2 WATCHDOG");
    } else {
        uart_puts("3 RESERVED");
    }

    uart_crlf();

    while (1) {
        uart_putc('.');
        delay_crude();
    }
}
