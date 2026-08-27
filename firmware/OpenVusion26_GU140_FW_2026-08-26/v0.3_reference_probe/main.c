#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "timebase.h"
#include "uart1.h"

/*
 * v0.3_reference_probe
 *
 * SAFE stage:
 * - no SPI traffic to the EPD
 * - DOES NOT TOUCH P1_2 / candidate EPD D/C
 * - only exercises candidate EPD_PWR, EPD_CS, EPD_RESET and reads BUSY
 * - P2_3/P2_4 are never touched
 */

static void log_reg(const char *name, uint8_t v)
{
    uart_puts(name);
    uart_putc('=');
    uart_puts("0x");
    uart_hex8(v);
    uart_putc(' ');
}

static void log_busy(const char *label)
{
    uart_puts(label);
    uart_puts(" BUSY=");
    uart_putc(EPD_BUSY ? '1' : '0');
    uart_crlf();
}

static void watch_busy(uint16_t duration_ms, uint16_t step_ms)
{
    uint8_t last = EPD_BUSY ? 1u : 0u;
    uint16_t elapsed = 0u;

    uart_puts("watch BUSY start=");
    uart_putc(last ? '1' : '0');
    uart_puts(" duration_ms=");
    uart_u16(duration_ms);
    uart_crlf();

    while (elapsed < duration_ms) {
        uint8_t now;
        delay_ms(step_ms);
        elapsed = (uint16_t)(elapsed + step_ms);
        now = EPD_BUSY ? 1u : 0u;

        if (now != last) {
            uart_puts("BUSY transition t~");
            uart_u16(elapsed);
            uart_puts("ms -> ");
            uart_putc(now ? '1' : '0');
            uart_crlf();
            last = now;
        }
    }

    uart_puts("watch BUSY end=");
    uart_putc(last ? '1' : '0');
    uart_crlf();
}

static void safe_candidate_gpio_init(void)
{
    /*
     * Set output latches before directions.
     * PWR active-low => HIGH is OFF.
     * CS HIGH = deselected.
     * RESET LOW = held in reset while powered off.
     */
    P0SEL &= (unsigned char)~(BV(0) | BV(1));
    P1SEL &= (unsigned char)~BV(3);
    P2SEL &= (unsigned char)~BV(0);

    EPD_PWR = 1;
    EPD_CS = 1;
    EPD_RESET = 0;

    P0DIR |= (uint8_t)(BV(0) | BV(1));
    P2DIR |= BV(0);

    P1DIR &= (unsigned char)~BV(3);
    P1INP |= BV(3);
}

void main(void)
{
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    timebase_init();
    EA = 1;

    uart_crlf();
    uart_puts("OpenVusion 2.6 GU140 reference probe v0.3");
    uart_crlf();
    uart_puts("UART1 Alt2 TX=P1_6 @115200 8N1");
    uart_crlf();
    uart_puts("P1_2 is NOT touched in this stage.");
    uart_crlf();

    uart_puts("timer selftest: wait ~500 ms ...");
    uart_crlf();
    delay_ms(500u);
    uart_puts("timer selftest: OK");
    uart_crlf();

    log_reg("P0", P0);
    log_reg("P0DIR", P0DIR);
    log_reg("P0SEL", P0SEL);
    uart_crlf();

    log_reg("P1", P1);
    log_reg("P1DIR", P1DIR);
    log_reg("P1SEL", P1SEL);
    uart_crlf();

    log_reg("P2", P2);
    log_reg("P2DIR", P2DIR);
    log_reg("P2SEL", P2SEL);
    uart_crlf();

    safe_candidate_gpio_init();

    uart_puts("--- stage A: panel OFF, reset LOW ---");
    uart_crlf();
    log_busy("A0");
    watch_busy(500u, 50u);

    uart_puts("--- stage B: panel OFF, reset HIGH ---");
    uart_crlf();
    EPD_RESET = 1;
    delay_ms(100u);
    log_busy("B0");
    watch_busy(500u, 50u);

    uart_puts("--- stage C: candidate panel power ON (P0_0 LOW) ---");
    uart_crlf();
    EPD_PWR = 0;
    log_busy("C0");
    watch_busy(1000u, 20u);

    uart_puts("--- stage D: hard-reset pulse H/L/H ---");
    uart_crlf();
    EPD_RESET = 1;
    delay_ms(5u);
    EPD_RESET = 0;
    delay_ms(20u);
    EPD_RESET = 1;
    delay_ms(10u);
    log_busy("D0");
    watch_busy(5000u, 20u);

    uart_puts("--- shutdown ---");
    uart_crlf();
    EPD_RESET = 0;
    delay_ms(20u);
    EPD_PWR = 1;
    EPD_CS = 1;
    log_busy("OFF");

    uart_puts("RESULT: probe finished. No EPD SPI bytes were sent.");
    uart_crlf();
    uart_puts("Power-cycle to repeat.");
    uart_crlf();

    while (1) {
    }
}
