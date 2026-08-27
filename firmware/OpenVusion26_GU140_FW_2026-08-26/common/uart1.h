#ifndef OV26_UART1_H
#define OV26_UART1_H

#include <stdint.h>

void uart1_init_115200_alt2_tx_p16(void);
void uart_putc(char c);
void uart_puts(const char *s);
void uart_hex8(uint8_t v);
void uart_hex16(uint16_t v);
void uart_u16(uint16_t v);
void uart_crlf(void);

#endif
