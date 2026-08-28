#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-045 / v0.7a — NFC-C FD + LED pair.
 * P1_1 input (FD candidate, REFERENCE). P2_1+P2_2 = proven LED_ON (RGB then white).
 * Debugger must be isolated at runtime (P2_1/P2_2 = DD/DC).
 * Blink when FD==0 (active-low HYPOTHESIS). No I2C. No P2_3/P2_4. P0_2 untouched.
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
    uint8_t fd;
    uint8_t field;
    uint8_t led;
    uint8_t n;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~BV(1);
    P1DIR &= (unsigned char)~BV(1);

    P2SEL &= (uint8_t)~0x06u;
    P2_1 = 0;
    P2_2 = 0;
    P2DIR |= 0x06u;

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-045 v0.7a NFC-C FD LED");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    led = 0u;
    n = 0u;
    while (n < 4u) {
        fd = NFC_FD ? 1u : 0u;
        field = fd ? 0u : 1u;
        uart_puts("FD=");
        uart_hex8(fd);
        uart_puts(" FIELD=");
        uart_hex8(field);
        uart_crlf();
        n++;
        delay_crude();
    }
    uart_puts("DONE");
    uart_crlf();

    while (1) {
        fd = NFC_FD ? 1u : 0u;
        field = fd ? 0u : 1u;
        if (field) {
            led ^= 1u;
            P2_1 = led;
            P2_2 = led;
        } else {
            led = 0u;
            P2_1 = 0;
            P2_2 = 0;
        }
        uart_puts("FD=");
        uart_hex8(fd);
        uart_puts(" FIELD=");
        uart_hex8(field);
        uart_puts(" LED=");
        uart_hex8(led);
        uart_crlf();
        delay_crude();
    }
}
