#include <cc2510fx.h>
#include <stdint.h>
#include "board.h"
#include "uart1.h"

void uart1_init_115200_alt2_tx_p16_baud_e(uint8_t baud_e)
{
    P1SEL &= (unsigned char)~BV(4);
    FLASH_CS = 1;
    P1DIR |= BV(4);

    PERCFG |= 0x02u;
    U1BAUD = 34u;
    U1GCR = (unsigned char)((U1GCR & (unsigned char)~0x1Fu) | (baud_e & 0x1Fu));
    U1CSR |= 0x80u;
    U1UCR &= (unsigned char)~0x7Du;
    U1UCR |= 0x02u;
    P1SEL |= BV(6);
}

void uart1_init_115200_alt2_tx_p16(void)
{
    /* BAUD_E=12, BAUD_M=34 @ 26 MHz -> ~115200 */
    uart1_init_115200_alt2_tx_p16_baud_e(12u);
}

void uart_putc(char c)
{
    U1CSR &= (unsigned char)~0x02u;
    U1DBUF = (unsigned char)c;
    while (!(U1CSR & 0x02u)) {}
    U1CSR &= (unsigned char)~0x02u;
}

void uart_puts(const char *s)
{
    while (*s) uart_putc(*s++);
}

void uart_crlf(void)
{
    uart_putc('\r');
    uart_putc('\n');
}

void uart_u16(uint16_t v)
{
    char buf[6];
    uint8_t i = 0u;
    if (v == 0u) { uart_putc('0'); return; }
    while (v && i < sizeof(buf)) {
        buf[i++] = (char)('0' + (v % 10u));
        v /= 10u;
    }
    while (i) uart_putc(buf[--i]);
}

void uart_hex8(uint8_t v)
{
    static const char hex[] = "0123456789ABCDEF";
    uart_putc(hex[(v >> 4) & 0x0Fu]);
    uart_putc(hex[v & 0x0Fu]);
}
