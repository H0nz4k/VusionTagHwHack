#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "timebase.h"
#include "uart1.h"
#include "i2c.h"

/*
 * v0.6_nfc_probe - DRAFT / PREPARED
 *
 * Related VUSION hardware uses:
 *   P0_4 = SDA
 *   P0_6 = SCL
 *   P1_0 = NFC/flash power
 *   8-bit I2C addresses: write 0xAA, read 0xAB
 *
 * This stage only checks ACK for address 0xAA.
 * It does not write NFC memory.
 *
 * Do NOT flash until the display stages are finished and these NFC pins
 * are accepted for the exact board.
 */

void main(void)
{
    uint8_t ack;

    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();
    timebase_init();
    EA = 1;

    uart_crlf();
    uart_puts("OpenVusion 2.6 GU140 NFC ACK probe v0.6 DRAFT");
    uart_crlf();

    /* Power candidate NFC/flash rail. */
    P1SEL &= (unsigned char)~BV(0);
    NFC_PWR = 1;
    P1DIR |= BV(0);
    delay_ms(50u);

    i2c_init_p04_p06();

    uart_puts("Probe 8-bit I2C write address 0xAA...");
    uart_crlf();

    i2c_start();
    ack = i2c_write(0xAAu);
    i2c_stop();

    uart_puts("ACK=");
    uart_putc(ack ? '1' : '0');
    uart_crlf();

    if (ack) {
        uart_puts("Candidate NFC device responded.");
    } else {
        uart_puts("No ACK. This is inconclusive; do not infer absent NFC.");
    }
    uart_crlf();

    while (1) {
    }
}
