#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * v0.3f — LED candidates P2_1 / P2_2 only.
 * Debugger shares these pins: runtime MUST have GPIO27 debug lines OFF.
 * Do not touch P2_0 (EPD reset) or P2_3/P2_4 (32 kHz crystal).
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

static void delay_states(void)
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
    uint8_t reset_cause;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);

    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    /* GPIO, latch low, then outputs. Bits 1 and 2 only. */
    P2SEL &= (uint8_t)~0x06u;
    P2_1 = 0;
    P2_2 = 0;
    P2DIR |= 0x06u;

    uart_crlf();
    uart_puts("OpenVusion GU140 v0.3f LED P2 TEST");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    while (1) {
        led_state(0, 0);
        delay_states();
        led_state(1, 0);
        delay_states();
        led_state(0, 1);
        delay_states();
        led_state(1, 1);
        delay_states();
    }
}
