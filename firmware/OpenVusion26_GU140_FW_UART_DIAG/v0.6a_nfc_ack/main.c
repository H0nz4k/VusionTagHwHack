#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-039 / v0.6a — NFC-A I2C write-address 0xAA ACK.
 * Flattened into main.c (clock+uart only). No i2c.rel.
 * One delay helper only (delay_crude). Bit pauses are unrolled nops.
 * P0_2 untouched. P2_3/P2_4 untouched. No EEPROM write.
 *
 * ACK0: P0_4/P0_6 only (P1_0 left as reset input).
 * ACK1: same probe after P1_0 driven HIGH (related-model NFC power).
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
    uint8_t ack1;
    uint8_t pass;
    uint8_t bit;
    uint8_t value;
    uint8_t n;
    uint8_t pause;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-039 v0.6a NFC-A ACK");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    /* GPIO I2C on P0_4/P0_6. Do not touch P0_2 DIR/SEL. */
    P0SEL &= (unsigned char)~(BV(4) | BV(6));
    P0INP |= (uint8_t)(BV(4) | BV(6));
    P0DIR &= (unsigned char)~(BV(4) | BV(6));

    ack0 = 0u;
    ack1 = 0u;
    for (pass = 0u; pass < 2u; ++pass) {
        if (pass == 1u) {
            P1SEL &= (unsigned char)~BV(0);
            NFC_PWR = 1;
            P1DIR |= BV(0);
            delay_crude();
        }

        /* START */
        P0DIR &= (unsigned char)~(BV(4) | BV(6));
        pause = 12u;
        while (pause != 0u) { __asm nop __endasm; pause--; }
        NFC_SDA = 0;
        P0DIR |= BV(4);
        pause = 12u;
        while (pause != 0u) { __asm nop __endasm; pause--; }
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
            pause = 12u;
            while (pause != 0u) { __asm nop __endasm; pause--; }
            P0DIR &= (unsigned char)~BV(6);
            pause = 12u;
            while (pause != 0u) { __asm nop __endasm; pause--; }
            NFC_SCL = 0;
            P0DIR |= BV(6);
            value <<= 1;
        }

        /* ACK bit */
        P0DIR &= (unsigned char)~BV(4);
        pause = 12u;
        while (pause != 0u) { __asm nop __endasm; pause--; }
        P0DIR &= (unsigned char)~BV(6);
        pause = 12u;
        while (pause != 0u) { __asm nop __endasm; pause--; }
        if (pass == 0u) {
            ack0 = NFC_SDA ? 0u : 1u;
        } else {
            ack1 = NFC_SDA ? 0u : 1u;
        }
        NFC_SCL = 0;
        P0DIR |= BV(6);
        pause = 12u;
        while (pause != 0u) { __asm nop __endasm; pause--; }

        /* STOP */
        NFC_SDA = 0;
        P0DIR |= BV(4);
        pause = 12u;
        while (pause != 0u) { __asm nop __endasm; pause--; }
        P0DIR &= (unsigned char)~BV(6);
        pause = 12u;
        while (pause != 0u) { __asm nop __endasm; pause--; }
        P0DIR &= (unsigned char)~BV(4);
        pause = 12u;
        while (pause != 0u) { __asm nop __endasm; pause--; }
    }

    uart_puts("ACK0=");
    uart_hex8(ack0);
    uart_crlf();
    uart_puts("ACK1=");
    uart_hex8(ack1);
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
