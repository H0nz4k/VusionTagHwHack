#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "timebase.h"
#include "uart1.h"
#include "epd.h"

/*
 * v0.4_cog_probe
 *
 * PREPARED, BUT DO NOT FLASH until:
 *   1) v0.3 gives plausible EPD BUSY behavior, AND
 *   2) P1_2 -> EPD D/C is accepted/verified for the exact GU140.
 *
 * It initializes the Pervasive E2266JS0C2 CoG but sends NO image frames
 * and NO display-refresh command.
 */

void main(void)
{
    uint8_t ok;

    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();
    timebase_init();
    EA = 1;

    uart_crlf();
    uart_puts("OpenVusion 2.6 GU140 CoG probe v0.4");
    uart_crlf();

    epd_bus_init();

    uart_puts("Initial BUSY=");
    uart_putc(epd_busy() ? '1' : '0');
    uart_crlf();

    uart_puts("COG init: power + hard reset + official 2.66 init registers");
    uart_crlf();
    ok = epd_cog_init_266();

    if (!ok) {
        uart_puts("FAIL: BUSY timeout after soft reset");
        uart_crlf();
        epd_reset_low();
        epd_power_off_gpio();
        while (1) {}
    }

    uart_puts("PASS: COG accepted init / BUSY became ready");
    uart_crlf();
    uart_puts("No image data and no refresh command sent.");
    uart_crlf();

    delay_ms(500u);

    uart_puts("Powering CoG down safely...");
    uart_crlf();
    ok = epd_cog_power_off();

    uart_puts(ok ? "Power-off PASS" : "Power-off timeout; GPIO shutdown forced");
    uart_crlf();

    while (1) {
    }
}
