#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-040 / v0.6b — NFC-A retry: one I2C 0xAA probe, ACK0 only.
 * No P1_0. Bit pauses reuse static dly_b (not a second delay function).
 * P0_2 untouched. No EEPROM write.
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
    uint8_t ack0;
    uint8_t bit;
    uint8_t value;
    uint8_t n;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-040 v0.6b NFC-A ACK0");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    P0SEL &= (unsigned char)~(BV(4) | BV(6));
    P0INP |= (uint8_t)(BV(4) | BV(6));
    P0DIR &= (unsigned char)~(BV(4) | BV(6));

    /* START */
    P0DIR &= (unsigned char)~(BV(4) | BV(6));
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }
    NFC_SDA = 0;
    P0DIR |= BV(4);
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }
    NFC_SCL = 0;
    P0DIR |= BV(6);

    value = 0xAAu;
    for (bit = 0u; bit < 8u; ++bit) {
        if (value & 0x80u) {
            P0DIR &= (unsigned char)~BV(4);
        } else {
            NFC_SDA = 0;
            P0DIR |= BV(4);
        }
        dly_b = 80u;
        while (dly_b != 0u) {
            __asm
                nop
            __endasm;
            dly_b--;
        }
        P0DIR &= (unsigned char)~BV(6);
        dly_b = 80u;
        while (dly_b != 0u) {
            __asm
                nop
            __endasm;
            dly_b--;
        }
        NFC_SCL = 0;
        P0DIR |= BV(6);
        value <<= 1;
    }

    P0DIR &= (unsigned char)~BV(4);
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }
    P0DIR &= (unsigned char)~BV(6);
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }
    ack0 = NFC_SDA ? 0u : 1u;
    NFC_SCL = 0;
    P0DIR |= BV(6);
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }

    /* STOP */
    NFC_SDA = 0;
    P0DIR |= BV(4);
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }
    P0DIR &= (unsigned char)~BV(6);
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }
    P0DIR &= (unsigned char)~BV(4);
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }

    uart_puts("ACK0=");
    uart_hex8(ack0);
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
