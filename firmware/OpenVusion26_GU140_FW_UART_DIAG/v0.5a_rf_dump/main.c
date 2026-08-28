#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-034 / v0.5a — RF-A radio register dump. No TX, no profile write.
 * Flattened UART (no pointer helpers). P2_3/P2_4 untouched. IOCFG not written.
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
    uint8_t n;
    uint8_t v_test2;
    uint8_t v_test1;
    uint8_t v_test0;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-034 v0.5a RF-A DUMP");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    uart_puts("MARC=");
    uart_hex8((uint8_t)(MARCSTATE & 0x1Fu));
    uart_puts(" PART=");
    uart_hex8(PARTNUM);
    uart_puts(" VER=");
    uart_hex8(VERSION);
    uart_crlf();
    uart_puts("SYNC1=");
    uart_hex8(SYNC1);
    uart_puts(" SYNC0=");
    uart_hex8(SYNC0);
    uart_puts(" PKTLEN=");
    uart_hex8(PKTLEN);
    uart_puts(" PKTCTRL1=");
    uart_hex8(PKTCTRL1);
    uart_puts(" PKTCTRL0=");
    uart_hex8(PKTCTRL0);
    uart_crlf();
    uart_puts("ADDR=");
    uart_hex8(ADDR);
    uart_puts(" CHANNR=");
    uart_hex8(CHANNR);
    uart_puts(" FSCTRL1=");
    uart_hex8(FSCTRL1);
    uart_puts(" FSCTRL0=");
    uart_hex8(FSCTRL0);
    uart_crlf();
    uart_puts("FREQ2=");
    uart_hex8(FREQ2);
    uart_puts(" FREQ1=");
    uart_hex8(FREQ1);
    uart_puts(" FREQ0=");
    uart_hex8(FREQ0);
    uart_crlf();
    uart_puts("MDMCFG4=");
    uart_hex8(MDMCFG4);
    uart_puts(" MDMCFG3=");
    uart_hex8(MDMCFG3);
    uart_puts(" MDMCFG2=");
    uart_hex8(MDMCFG2);
    uart_puts(" MDMCFG1=");
    uart_hex8(MDMCFG1);
    uart_puts(" MDMCFG0=");
    uart_hex8(MDMCFG0);
    uart_puts(" DEVIATN=");
    uart_hex8(DEVIATN);
    uart_crlf();
    uart_puts("MCSM2=");
    uart_hex8(MCSM2);
    uart_puts(" MCSM1=");
    uart_hex8(MCSM1);
    uart_puts(" MCSM0=");
    uart_hex8(MCSM0);
    uart_puts(" PA=");
    uart_hex8(PA_TABLE0);
    uart_crlf();

    v_test2 = *(__xdata volatile unsigned char *)0xDF23;
    v_test1 = *(__xdata volatile unsigned char *)0xDF24;
    v_test0 = *(__xdata volatile unsigned char *)0xDF25;
    uart_puts("TEST2=");
    uart_hex8(v_test2);
    uart_puts(" TEST1=");
    uart_hex8(v_test1);
    uart_puts(" TEST0=");
    uart_hex8(v_test0);
    uart_crlf();
    uart_puts("RSSI=");
    uart_hex8(RSSI);
    uart_puts(" LQI=");
    uart_hex8(LQI);
    uart_puts(" PKTST=");
    uart_hex8(PKTSTATUS);
    uart_puts(" RFIF=");
    uart_hex8(RFIF);
    uart_puts(" RFIM=");
    uart_hex8(RFIM);
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
        uart_hex8((uint8_t)(MARCSTATE & 0x1Fu));
        uart_crlf();
        n++;
    }
    uart_puts("DONE");
    uart_crlf();
    while (1) {}
}
