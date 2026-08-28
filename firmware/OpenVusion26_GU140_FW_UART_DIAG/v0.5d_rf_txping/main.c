#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "ovh_proto.h"
#include "radio_profile.h"
#include "uart1.h"

/*
 * EXP-037 / v0.5d — three short PING bursts at -30 dBm then IDLE.
 * Flattened. OTA not claimed without a receiver.
 */

static volatile uint8_t dly_a;
static volatile uint16_t dly_b;
static volatile uint16_t spins;

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
    uint8_t pkt;
    uint8_t ok;
    uint8_t n;
    uint8_t i;
    uint8_t sent;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-037 v0.5d RF-D TXPING");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    RFST = OVH_RFST_SIDLE;
    SYNC1 = OVH_RF_SYNC1;
    SYNC0 = OVH_RF_SYNC0;
    PKTLEN = OVH_RF_PKTLEN;
    PKTCTRL1 = OVH_RF_PKTCTRL1;
    PKTCTRL0 = OVH_RF_PKTCTRL0;
    ADDR = OVH_RF_ADDR;
    CHANNR = OVH_RF_CHANNR;
    FSCTRL1 = OVH_RF_FSCTRL1;
    FSCTRL0 = OVH_RF_FSCTRL0;
    FREQ2 = OVH_RF_FREQ2;
    FREQ1 = OVH_RF_FREQ1;
    FREQ0 = OVH_RF_FREQ0;
    MDMCFG4 = OVH_RF_MDMCFG4;
    MDMCFG3 = OVH_RF_MDMCFG3;
    MDMCFG2 = OVH_RF_MDMCFG2;
    MDMCFG1 = OVH_RF_MDMCFG1;
    MDMCFG0 = OVH_RF_MDMCFG0;
    DEVIATN = OVH_RF_DEVIATN;
    MCSM2 = OVH_RF_MCSM2;
    MCSM1 = OVH_RF_MCSM1;
    MCSM0 = OVH_RF_MCSM0;
    PA_TABLE0 = OVH_RF_PA_TABLE0;
    TEST2 = OVH_RF_TEST2;
    TEST1 = OVH_RF_TEST1;

    cal = 0u;
    for (i = 0u; i < 255u; ++i) {
        if ((MARCSTATE & 0x1Fu) == OVH_MARC_IDLE) {
            cal = 1u;
            break;
        }
    }
    if (cal) {
        RFST = OVH_RFST_SCAL;
        cal = 0u;
        n = 0u;
        while (n < 40u) {
            for (i = 0u; i < 255u; ++i) {
                if ((MARCSTATE & 0x1Fu) == OVH_MARC_IDLE) {
                    cal = 1u;
                    break;
                }
            }
            if (cal) {
                break;
            }
            n++;
        }
    }
    uart_puts("CAL=");
    uart_hex8(cal);
    uart_puts(" PA=");
    uart_hex8(PA_TABLE0);
    uart_crlf();

    for (pkt = 0u; pkt < 3u; ++pkt) {
        RFST = OVH_RFST_SIDLE;
        RFIF = 0u;
        RFTXRXIF = 0;
        RFST = OVH_RFST_STX;
        ok = 0u;
        spins = 0u;
        while (!RFTXRXIF) {
            spins++;
            if (spins >= 50000u) {
                break;
            }
        }
        sent = 0u;
        if (RFTXRXIF) {
            ok = 1u;
            RFTXRXIF = 0;
            RFD = 18u;
            sent = 1u;
        }
        uart_puts("TX seq=");
        uart_hex8((uint8_t)(pkt + 1u));
        uart_puts(" OK=");
        uart_hex8(ok);
        uart_puts(" SENT=");
        uart_hex8(sent);
        uart_puts(" MARC=");
        uart_hex8((uint8_t)(MARCSTATE & 0x1Fu));
        uart_puts(" RFIF=");
        uart_hex8(RFIF);
        uart_crlf();
        RFST = OVH_RFST_SIDLE;
        delay_crude();
        delay_crude();
        delay_crude();
    }

    n = 0u;
    while (n < 3u) {
        delay_crude();
        uart_puts("HB ");
        uart_hex8(n);
        uart_puts(" MARC=");
        uart_hex8((uint8_t)(MARCSTATE & 0x1Fu));
        uart_crlf();
        n++;
    }
    uart_puts("DONE");
    uart_crlf();
    while (1) {}
}
