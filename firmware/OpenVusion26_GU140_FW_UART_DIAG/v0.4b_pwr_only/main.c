#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-023 / v0.4b — Phase 2 EPD_PWR only (P0_0).
 * No RESET, no SPI, P0_2 untouched. P1_3 remains input.
 * Locals only in main() — SDCC overlay.
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

void main(void)
{
    uint8_t reset_cause;
    uint8_t n;
    uint8_t busy;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);

    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~BV(3);
    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);

    P0SEL &= (unsigned char)~BV(0);
    EPD_PWR = 1;
    P0DIR |= BV(0);

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-023 v0.4b PWR");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();
    uart_puts("P0DIR=");
    uart_hex8(P0DIR);
    uart_puts(" P1DIR=");
    uart_hex8(P1DIR);
    uart_puts(" P2DIR=");
    uart_hex8(P2DIR);
    uart_crlf();

    uart_puts("STATE PWR_OFF P0_0=1 BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    delay_crude();
    delay_crude();

    uart_puts("STATE PWR_ON P0_0=0");
    uart_crlf();
    EPD_PWR = 0;

    n = 0u;
    busy = EPD_BUSY ? 1u : 0u;
    uart_puts("S ");
    uart_hex8(n);
    uart_puts(" BUSY=");
    uart_putc(busy ? '1' : '0');
    uart_crlf();

    delay_crude();
    n = 1u;
    busy = EPD_BUSY ? 1u : 0u;
    uart_puts("S ");
    uart_hex8(n);
    uart_puts(" BUSY=");
    uart_putc(busy ? '1' : '0');
    uart_crlf();

    delay_crude();
    n = 2u;
    busy = EPD_BUSY ? 1u : 0u;
    uart_puts("S ");
    uart_hex8(n);
    uart_puts(" BUSY=");
    uart_putc(busy ? '1' : '0');
    uart_crlf();

    delay_crude();
    n = 3u;
    busy = EPD_BUSY ? 1u : 0u;
    uart_puts("S ");
    uart_hex8(n);
    uart_puts(" BUSY=");
    uart_putc(busy ? '1' : '0');
    uart_crlf();

    delay_crude();
    n = 4u;
    busy = EPD_BUSY ? 1u : 0u;
    uart_puts("S ");
    uart_hex8(n);
    uart_puts(" BUSY=");
    uart_putc(busy ? '1' : '0');
    uart_crlf();

    delay_crude();
    n = 5u;
    busy = EPD_BUSY ? 1u : 0u;
    uart_puts("S ");
    uart_hex8(n);
    uart_puts(" BUSY=");
    uart_putc(busy ? '1' : '0');
    uart_crlf();

    uart_puts("STATE PWR_OFF P0_0=1");
    uart_crlf();
    EPD_PWR = 1;
    delay_crude();
    uart_puts("BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();
    uart_puts("DONE");
    uart_crlf();

    n = 0u;
    while (1) {
        delay_crude();
        uart_puts("HB ");
        uart_hex8(n);
        uart_puts(" BUSY=");
        uart_putc(EPD_BUSY ? '1' : '0');
        uart_crlf();
        n++;
    }
}
