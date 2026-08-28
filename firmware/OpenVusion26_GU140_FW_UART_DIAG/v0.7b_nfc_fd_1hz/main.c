#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-046 / v0.7b — 1 Hz LED while TWN4 is in range.
 * FD on P1_1 is a short pulse (EXP-045: two blinks). Poll during delay,
 * sticky hold retriggered by FD=0, blink 0.5 s on / 0.5 s off.
 * P2_1+P2_2 LED pair. Debugger isolated at runtime. No P2_3/P2_4. P0_2 untouched.
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
    uint8_t saw;
    uint8_t hold;
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
    uart_puts("OpenVusion GU140 EXP-046 v0.7b NFC FD 1Hz");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    n = 0u;
    while (n < 4u) {
        fd = NFC_FD ? 1u : 0u;
        uart_puts("FD=");
        uart_hex8(fd);
        uart_crlf();
        n++;
        delay_crude();
    }
    uart_puts("DONE");
    uart_crlf();

    hold = 0u;
    led = 0u;
    while (1) {
        saw = 0u;
        for (dly_a = 0u; dly_a < 9u; ++dly_a) {
            for (dly_b = 0u; dly_b < 30000u; ++dly_b) {
                if (((uint8_t)dly_b & 0x3Fu) == 0u) {
                    if (!NFC_FD) {
                        saw = 1u;
                    }
                }
                __asm
                    nop
                __endasm;
            }
        }
        if (saw) {
            hold = 8u;
        }
        if (hold != 0u) {
            hold--;
            led ^= 1u;
            P2_1 = led;
            P2_2 = led;
        } else {
            led = 0u;
            P2_1 = 0;
            P2_2 = 0;
        }
        uart_puts("SAW=");
        uart_hex8(saw);
        uart_puts(" HOLD=");
        uart_hex8(hold);
        uart_puts(" LED=");
        uart_hex8(led);
        uart_crlf();
    }
}
