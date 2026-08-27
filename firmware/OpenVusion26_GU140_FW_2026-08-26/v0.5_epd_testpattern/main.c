#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "timebase.h"
#include "uart1.h"
#include "epd.h"

/*
 * v0.5_epd_testpattern
 *
 * PREPARED, BUT DO NOT FLASH before v0.4 succeeds.
 *
 * E2266JS0C2: 296 x 152, B/W/R
 * bytes per row = 152 / 8 = 19
 * plane size    = 296 * 19 = 5624 bytes
 *
 * Pattern:
 *   one third BLACK | one third WHITE | one third RED
 *
 * Plane polarity is based on the related VUSION firmware:
 *   black = plane10 0x00, plane13 0xFF
 *   white = plane10 0xFF, plane13 0xFF
 *   red   = plane10 0xFF, plane13 0x00
 *
 * Even if orientation differs, three large color regions should be obvious.
 */

#define ROWS            296u
#define BYTES_PER_ROW    19u

static uint8_t plane10_byte(uint8_t xbyte)
{
    if (xbyte < 6u) return 0x00u;  /* black */
    return 0xFFu;                  /* white or red */
}

static uint8_t plane13_byte(uint8_t xbyte)
{
    if (xbyte < 13u) return 0xFFu; /* black or white */
    return 0x00u;                  /* red */
}

static void send_plane(uint8_t cmd, uint8_t second_plane)
{
    uint16_t row;
    uint8_t x;

    epd_begin_stream(cmd);

    for (row = 0u; row < ROWS; ++row) {
        for (x = 0u; x < BYTES_PER_ROW; ++x) {
            epd_stream_byte(second_plane ? plane13_byte(x) : plane10_byte(x));
        }

        if ((row & 0x3Fu) == 0u) {
            uart_puts(" row=");
            uart_u16(row);
            uart_crlf();
        }
    }

    epd_end_stream();
}

void main(void)
{
    uint8_t ok;

    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();
    timebase_init();
    EA = 1;

    uart_crlf();
    uart_puts("OpenVusion 2.6 GU140 EPD testpattern v0.5");
    uart_crlf();

    epd_bus_init();

    uart_puts("COG init...");
    uart_crlf();
    if (!epd_cog_init_266()) {
        uart_puts("FAIL: COG init BUSY timeout");
        uart_crlf();
        epd_reset_low();
        epd_power_off_gpio();
        while (1) {}
    }

    uart_puts("Sending plane 0x10 (5624 bytes)...");
    uart_crlf();
    send_plane(0x10u, 0u);

    uart_puts("Sending plane 0x13 (5624 bytes)...");
    uart_crlf();
    send_plane(0x13u, 1u);

    uart_puts("DCDC power on command 0x04...");
    uart_crlf();
    epd_send_cmd_data1(0x04u, 0x00u);
    if (!epd_wait_ready(10000u)) {
        uart_puts("FAIL: BUSY timeout after DCDC power-on");
        uart_crlf();
        epd_reset_low();
        epd_power_off_gpio();
        while (1) {}
    }

    uart_puts("Display refresh command 0x12...");
    uart_crlf();
    epd_send_cmd_data1(0x12u, 0x00u);
    if (!epd_wait_ready(30000u)) {
        uart_puts("FAIL: BUSY timeout during refresh");
        uart_crlf();
        epd_reset_low();
        epd_power_off_gpio();
        while (1) {}
    }

    uart_puts("Refresh PASS. Powering down CoG...");
    uart_crlf();
    ok = epd_cog_power_off();
    uart_puts(ok ? "DONE: image should persist without power." :
                   "DONE with power-off timeout; GPIO shutdown forced.");
    uart_crlf();

    while (1) {
    }
}
