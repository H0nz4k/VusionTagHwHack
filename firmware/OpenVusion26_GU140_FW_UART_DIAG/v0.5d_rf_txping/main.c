#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "ovh_proto.h"
#include "radio.h"
#include "radio_profile.h"
#include "uart1.h"

/*
 * EXP-037 / v0.5d — RF-D three short PING bursts at -30 dBm then IDLE.
 * OTA is NOT claimed without an independent receiver.
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

static uint8_t wait_rftxrx(uint16_t lim)
{
    spins = 0u;
    while (!RFTXRXIF) {
        spins++;
        if (spins >= lim) {
            return 0u;
        }
    }
    return 1u;
}

static void rfd_put(uint8_t v)
{
    RFTXRXIF = 0;
    RFD = v;
}

void main(void)
{
    uint8_t reset_cause;
    uint8_t cal;
    uint8_t pkt;
    uint8_t ok;
    uint8_t n;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-037 v0.5d RF-D TXPING");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();

    radio_apply_profile();
    cal = radio_calibrate();
    uart_puts("CAL=");
    uart_hex8(cal);
    uart_puts(" PA=");
    uart_hex8(PA_TABLE0);
    uart_crlf();

    for (pkt = 0u; pkt < 3u; ++pkt) {
        radio_idle();
        (void)radio_wait_marc(OVH_MARC_IDLE, 40000u);
        RFIF = 0u;
        RFTXRXIF = 0;
        RFST = OVH_RFST_STX;
        ok = wait_rftxrx(50000u);
        if (ok) {
            /* variable-length: length byte then 16 B header + 2 B nonce */
            rfd_put(18u);
            if (wait_rftxrx(20000u)) { rfd_put(OVH_MAGIC0); }
            if (wait_rftxrx(20000u)) { rfd_put(OVH_MAGIC1); }
            if (wait_rftxrx(20000u)) { rfd_put(OVH_MAGIC2); }
            if (wait_rftxrx(20000u)) { rfd_put(OVH_PROTO_VER); }
            if (wait_rftxrx(20000u)) { rfd_put(OVH_TYPE_PING); }
            if (wait_rftxrx(20000u)) { rfd_put(0x01); } /* dest LE 0x00000001 */
            if (wait_rftxrx(20000u)) { rfd_put(0x00); }
            if (wait_rftxrx(20000u)) { rfd_put(0x00); }
            if (wait_rftxrx(20000u)) { rfd_put(0x00); }
            if (wait_rftxrx(20000u)) { rfd_put(0x02); } /* src gateway */
            if (wait_rftxrx(20000u)) { rfd_put(0x00); }
            if (wait_rftxrx(20000u)) { rfd_put(0x00); }
            if (wait_rftxrx(20000u)) { rfd_put(0x00); }
            if (wait_rftxrx(20000u)) { rfd_put((uint8_t)(pkt + 1u)); }
            if (wait_rftxrx(20000u)) { rfd_put(0x00); }
            if (wait_rftxrx(20000u)) { rfd_put(OVH_FLAG_NEED_ACK); }
            if (wait_rftxrx(20000u)) { rfd_put('O'); }
            if (wait_rftxrx(20000u)) { rfd_put('V'); }
        }
        delay_crude();
        delay_crude();
        uart_puts("TX seq=");
        uart_hex8((uint8_t)(pkt + 1u));
        uart_puts(" OK=");
        uart_hex8(ok);
        uart_puts(" MARC=");
        uart_hex8(radio_marc());
        uart_puts(" RFIF=");
        uart_hex8(RFIF);
        uart_crlf();
        radio_recover();
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
        uart_hex8(radio_marc());
        uart_crlf();
        n++;
    }
    uart_puts("DONE");
    uart_crlf();
    while (1) {}
}
