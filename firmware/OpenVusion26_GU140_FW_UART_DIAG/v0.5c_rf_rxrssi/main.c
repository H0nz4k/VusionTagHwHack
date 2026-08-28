#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "radio.h"
#include "radio_profile.h"
#include "uart1.h"

/*
 * EXP-036 / v0.5c — RF-C bounded RX/RSSI window then IDLE. No packet claim.
 */

static volatile uint8_t dly_a;
static volatile uint16_t dly_b;
static volatile uint16_t tiny;

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

static void delay_tiny(void)
{
    for (tiny = 0u; tiny < 4000u; ++tiny) {
        __asm
            nop
        __endasm;
    }
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t cal;
    uint8_t rxok;
    uint8_t i;
    uint8_t r;
    uint8_t n;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-036 v0.5c RF-C RX");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    radio_apply_profile();
    cal = radio_calibrate();
    uart_puts("CAL=");
    uart_hex8(cal);
    uart_crlf();

    RFIF = 0u;
    RFST = OVH_RFST_SRX;
    rxok = radio_wait_marc(OVH_MARC_RX, 65000u);
    uart_puts("RXENT=");
    uart_hex8(rxok);
    uart_puts(" MARC=");
    uart_hex8(radio_marc());
    uart_crlf();

    for (i = 0u; i < 8u; ++i) {
        delay_tiny();
        r = RSSI;
        uart_puts("RSSI ");
        uart_hex8(i);
        uart_puts("=");
        uart_hex8(r);
        uart_puts(" MARC=");
        uart_hex8(radio_marc());
        uart_puts(" RFIF=");
        uart_hex8(RFIF);
        uart_crlf();
    }

    radio_recover();
    uart_puts("AFTER ");
    radio_dump_key();

    n = 0u;
    while (n < 3u) {
        delay_crude();
        uart_puts("HB ");
        uart_hex8(n);
        uart_puts(" MARC=");
        uart_hex8(radio_marc());
        uart_crlf();
        n++;
    }
    uart_puts("DONE");
    uart_crlf();
    while (1) {}
}
