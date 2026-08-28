#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "radio.h"
#include "radio_profile.h"
#include "uart1.h"

/*
 * EXP-035 / v0.5b — RF-B profile write + SCAL + IDLE. No TX. No unbounded RX.
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
    uint8_t cal;
    uint8_t n;
    uint8_t match;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-035 v0.5b RF-B IDLE");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    radio_idle();
    radio_apply_profile();
    cal = radio_calibrate();

    uart_puts("CAL=");
    uart_hex8(cal);
    uart_crlf();
    radio_dump_key();

    match = 1u;
    if (SYNC1 != OVH_RF_SYNC1) match = 0u;
    if (SYNC0 != OVH_RF_SYNC0) match = 0u;
    if (PKTCTRL0 != OVH_RF_PKTCTRL0) match = 0u;
    if (FREQ2 != OVH_RF_FREQ2) match = 0u;
    if (FREQ1 != OVH_RF_FREQ1) match = 0u;
    if (FREQ0 != OVH_RF_FREQ0) match = 0u;
    if (MDMCFG4 != OVH_RF_MDMCFG4) match = 0u;
    if (PA_TABLE0 != OVH_RF_PA_TABLE0) match = 0u;
    uart_puts("MATCH=");
    uart_hex8(match);
    uart_puts(" IDLE=");
    uart_hex8((radio_marc() == OVH_MARC_IDLE) ? 1u : 0u);
    uart_crlf();

    n = 0u;
    while (n < 4u) {
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
