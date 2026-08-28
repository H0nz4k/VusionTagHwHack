#include <cc2510fx.h>
#include <stdint.h>

#include "radio.h"
#include "radio_profile.h"
#include "uart1.h"

/* Not linked into v0.5* HIL targets: extra .rel overlayed UART (EXP-035). */

/* Do not touch IOCFG0/1/2 — P1_6 is UART TX. */

void radio_idle(void)
{
    RFST = OVH_RFST_SIDLE;
}

uint8_t radio_marc(void)
{
    return (uint8_t)(MARCSTATE & 0x1Fu);
}

uint8_t radio_wait_marc(uint8_t want, uint16_t spins)
{
    uint16_t i;
    for (i = 0u; i < spins; ++i) {
        if (radio_marc() == want) {
            return 1u;
        }
    }
    return 0u;
}

void radio_apply_profile(void)
{
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
}

uint8_t radio_calibrate(void)
{
    radio_idle();
    if (!radio_wait_marc(OVH_MARC_IDLE, 40000u)) {
        return 0u;
    }
    RFST = OVH_RFST_SCAL;
    if (!radio_wait_marc(OVH_MARC_IDLE, 65000u)) {
        return 0u;
    }
    return 1u;
}

void radio_recover(void)
{
    radio_idle();
    (void)radio_wait_marc(OVH_MARC_IDLE, 40000u);
    RFIF = 0u;
}

void radio_dump_key(void)
{
    uart_puts("MARC=");
    uart_hex8(radio_marc());
    uart_puts(" PART=");
    uart_hex8(PARTNUM);
    uart_puts(" VER=");
    uart_hex8(VERSION);
    uart_puts(" RSSI=");
    uart_hex8(RSSI);
    uart_puts(" LQI=");
    uart_hex8(LQI);
    uart_puts(" RFIF=");
    uart_hex8(RFIF);
    uart_puts(" PKTST=");
    uart_hex8(PKTSTATUS);
    uart_crlf();
    uart_puts("SYNC=");
    uart_hex8(SYNC1);
    uart_hex8(SYNC0);
    uart_puts(" PKTCTRL0=");
    uart_hex8(PKTCTRL0);
    uart_puts(" FREQ=");
    uart_hex8(FREQ2);
    uart_hex8(FREQ1);
    uart_hex8(FREQ0);
    uart_puts(" MDMCFG4=");
    uart_hex8(MDMCFG4);
    uart_puts(" PA=");
    uart_hex8(PA_TABLE0);
    uart_crlf();
}
