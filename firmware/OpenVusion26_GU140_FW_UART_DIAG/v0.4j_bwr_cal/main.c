#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-031 / v0.4j — B/W/R calibration. Same init/SPI/DCDC/0x12 as v0.4i.
 *
 * Encoding from EXP-030 (OVĚŘENO B/W) + official 2.66" BWR demo
 * image_266_296x152_BWR.c bit stats (red bits never overlap black=1):
 *   WHITE = plane10 0, plane13 0
 *   BLACK = plane10 1, plane13 0
 *   RED   = plane10 0, plane13 1
 *
 * Row = 37 bytes (296/8). Regions:
 *   col 0..11  BLACK
 *   col 12..24 WHITE
 *   col 25..36 RED
 * First 16 rows, col 0..15 forced BLACK (corner marker into white).
 */

#define PLANE 5624u
#define ROW_B 37u
#define MARK  592u

static volatile uint8_t dly_a;
static volatile uint16_t dly_b;
static volatile uint16_t spi_spins;

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

static uint8_t spi_tx(uint8_t v)
{
    spi_spins = 0u;
    U0CSR &= (unsigned char)~0x02u;
    U0DBUF = v;
    while (!(U0CSR & 0x02u)) {
        spi_spins++;
        if (spi_spins == 0u) {
            return 0u;
        }
    }
    U0CSR &= (unsigned char)~0x02u;
    return 1u;
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t n;
    uint8_t ok;
    uint16_t left;
    uint16_t sent;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P1SEL &= (unsigned char)~(BV(2) | BV(3));
    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);
    EPD_DC = 1;
    P1DIR |= BV(2);
    P0SEL &= (unsigned char)~BV(0);
    EPD_PWR = 1;
    P0DIR |= BV(0);

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-031 v0.4j BWR");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    delay_crude();
    delay_crude();
    EPD_PWR = 0;
    EPD_RESET = 1;
    P2DIR |= BV(0);
    delay_crude();
    EPD_RESET = 0;
    delay_crude();
    delay_crude();
    EPD_RESET = 1;
    EPD_CS = 1;
    P0DIR |= BV(1);
    delay_crude();
    PERCFG &= (unsigned char)~0x01u;
    U0CSR = 0x00u;
    U0GCR = (unsigned char)(BV(5) | 17u);
    U0BAUD = 0u;
    P0DIR |= (unsigned char)(BV(3) | BV(5));
    P0SEL |= (unsigned char)(BV(3) | BV(5));

    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0x00u);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x0Eu);
    }
    EPD_CS = 1;
    delay_crude();
    EPD_DC = 0;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0xE5u);
    }
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x19u);
    }
    EPD_CS = 1;
    EPD_DC = 0;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0xE0u);
    }
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x02u);
    }
    EPD_CS = 1;
    EPD_DC = 0;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x00u);
    }
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0xCFu);
    }
    if (ok) {
        ok = spi_tx(0x8Du);
    }
    EPD_CS = 1;
    uart_puts("INIT=");
    uart_hex8(ok);
    uart_crlf();

    uart_puts("P10");
    uart_crlf();
    sent = 0u;
    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0x10u);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    left = PLANE;
    reset_cause = 0u;
    while (ok && left) {
        n = 0x00u;
        if (reset_cause < 12u) {
            n = 0xFFu;
        }
        if ((sent < MARK) && (reset_cause < 16u)) {
            n = 0xFFu;
        }
        if (!spi_tx(n)) {
            ok = 0u;
        } else {
            sent++;
            left--;
            reset_cause++;
            if (reset_cause == ROW_B) {
                reset_cause = 0u;
            }
        }
    }
    EPD_CS = 1;
    uart_puts("N10=");
    uart_hex8((uint8_t)(sent >> 8));
    uart_hex8((uint8_t)sent);
    uart_puts(" OK=");
    uart_hex8(ok);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    uart_puts("P13");
    uart_crlf();
    sent = 0u;
    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0x13u);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    left = PLANE;
    reset_cause = 0u;
    while (ok && left) {
        n = 0x00u;
        if (reset_cause >= 25u) {
            n = 0xFFu;
        }
        if (!spi_tx(n)) {
            ok = 0u;
        } else {
            sent++;
            left--;
            reset_cause++;
            if (reset_cause == ROW_B) {
                reset_cause = 0u;
            }
        }
    }
    EPD_CS = 1;
    uart_puts("N13=");
    uart_hex8((uint8_t)(sent >> 8));
    uart_hex8((uint8_t)sent);
    uart_puts(" OK=");
    uart_hex8(ok);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0x04u);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x00u);
    }
    EPD_CS = 1;
    delay_crude();
    uart_puts("DCDC=");
    uart_hex8(ok);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    EPD_DC = 0;
    EPD_CS = 0;
    ok = spi_tx(0x12u);
    EPD_CS = 1;
    EPD_DC = 1;
    EPD_CS = 0;
    if (ok) {
        ok = spi_tx(0x00u);
    }
    EPD_CS = 1;
    uart_puts("REF=");
    uart_hex8(ok);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();

    uart_puts("CHK P0_2SEL=");
    uart_putc((P0SEL & BV(2)) ? '1' : '0');
    uart_puts(" CS=");
    uart_putc(EPD_CS ? '1' : '0');
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
