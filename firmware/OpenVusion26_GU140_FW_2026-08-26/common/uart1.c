#include <cc2510fx.h>
#include <stdint.h>
#include "board.h"
#include "uart1.h"

static char hex_digit(uint8_t v)
{
    v &= 0x0Fu;
    return (v < 10u) ? (char)('0' + v) : (char)('A' + (v - 10u));
}

void uart1_init_115200_alt2_tx_p16(void)
{
    /*
     * P1_6 is also the candidate external-flash MOSI.
     * Keep the flash deselected before assigning P1_6 to USART1.
     */
    P1SEL &= (unsigned char)~BV(4);
    FLASH_CS = 1;
    P1DIR |= BV(4);

    /*
     * USART1 UART, Alternative 2.
     * TX = P1_6.
     * RX is intentionally left unused/high-Z in this diagnostic build.
     *
     * 26 MHz, 115200 baud:
     * BAUD_M = 34, BAUD_E = 12 -> ~115051 baud (-0.13%).
     */
    PERCFG |= 0x02u;          /* U1CFG=1 -> Alternative 2 */
    U1CSR = 0x80u;            /* MODE=UART, receiver disabled */
    U1UCR = 0x02u;            /* 8N1, no HW flow control */
    U1BAUD = 34u;
    U1GCR = 12u;              /* BAUD_E=12, UART sends LSB first */

    P1SEL |= BV(6);           /* P1_6 -> USART1 TX */
}

void uart_putc(char c)
{
    U1CSR &= (unsigned char)~0x02u;  /* clear TX_BYTE */
    U1DBUF = (unsigned char)c;
    while (!(U1CSR & 0x02u)) {
    }
    U1CSR &= (unsigned char)~0x02u;
}

void uart_puts(const char *s)
{
    while (*s) {
        uart_putc(*s++);
    }
}

void uart_crlf(void)
{
    uart_putc('\r');
    uart_putc('\n');
}

void uart_hex8(uint8_t v)
{
    uart_putc(hex_digit((uint8_t)(v >> 4)));
    uart_putc(hex_digit(v));
}

void uart_hex16(uint16_t v)
{
    uart_hex8((uint8_t)(v >> 8));
    uart_hex8((uint8_t)v);
}

void uart_u16(uint16_t v)
{
    char buf[6];
    uint8_t i = 0;

    if (v == 0u) {
        uart_putc('0');
        return;
    }

    while ((v != 0u) && (i < sizeof(buf))) {
        buf[i++] = (char)('0' + (v % 10u));
        v /= 10u;
    }

    while (i) {
        uart_putc(buf[--i]);
    }
}
