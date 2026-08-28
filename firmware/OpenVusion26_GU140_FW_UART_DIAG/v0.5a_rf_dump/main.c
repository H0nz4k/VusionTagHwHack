#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "radio_profile.h"
#include "uart1.h"

/*
 * EXP-034 / v0.5a — RF-A radio register dump. No TX, no profile write.
 * P2_3/P2_4 untouched. P0_3 unused. IOCFG not written.
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

static void dump8(const char *n, uint8_t v)
{
    uart_puts(n);
    uart_hex8(v);
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t n;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-034 v0.5a RF-A DUMP");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    dump8("MARC=", MARCSTATE & 0x1Fu);
    dump8(" PART=", PARTNUM);
    dump8(" VER=", VERSION);
    uart_crlf();
    dump8("SYNC1=", SYNC1);
    dump8(" SYNC0=", SYNC0);
    dump8(" PKTLEN=", PKTLEN);
    dump8(" PKTCTRL1=", PKTCTRL1);
    dump8(" PKTCTRL0=", PKTCTRL0);
    uart_crlf();
    dump8("ADDR=", ADDR);
    dump8(" CHANNR=", CHANNR);
    dump8(" FSCTRL1=", FSCTRL1);
    dump8(" FSCTRL0=", FSCTRL0);
    uart_crlf();
    dump8("FREQ2=", FREQ2);
    dump8(" FREQ1=", FREQ1);
    dump8(" FREQ0=", FREQ0);
    uart_crlf();
    dump8("MDMCFG4=", MDMCFG4);
    dump8(" MDMCFG3=", MDMCFG3);
    dump8(" MDMCFG2=", MDMCFG2);
    dump8(" MDMCFG1=", MDMCFG1);
    dump8(" MDMCFG0=", MDMCFG0);
    dump8(" DEVIATN=", DEVIATN);
    uart_crlf();
    dump8("MCSM2=", MCSM2);
    dump8(" MCSM1=", MCSM1);
    dump8(" MCSM0=", MCSM0);
    dump8(" PA=", PA_TABLE0);
    uart_crlf();
    dump8("TEST2=", TEST2);
    dump8(" TEST1=", TEST1);
    dump8(" TEST0=", TEST0);
    uart_crlf();
    dump8("RSSI=", RSSI);
    dump8(" LQI=", LQI);
    dump8(" PKTST=", PKTSTATUS);
    dump8(" RFIF=", RFIF);
    dump8(" RFIM=", RFIM);
    uart_crlf();
    uart_puts("IOCFG2=");
    uart_hex8(IOCFG2);
    uart_puts(" IOCFG1=");
    uart_hex8(IOCFG1);
    uart_puts(" IOCFG0=");
    uart_hex8(IOCFG0);
    uart_crlf();

    n = 0u;
    while (n < 4u) {
        delay_crude();
        uart_puts("HB ");
        uart_hex8(n);
        uart_puts(" MARC=");
        uart_hex8(MARCSTATE & 0x1Fu);
        uart_crlf();
        n++;
    }
    uart_puts("DONE");
    uart_crlf();
    while (1) {}
}
