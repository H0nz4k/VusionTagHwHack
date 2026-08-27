#include <cc2510fx.h>
#include <stdint.h>

#define BV(x) (1U << (x))

static volatile uint32_t ticks_ms = 0;

/* WDT interrupt kazde cca 2 ms */
void wdt_isr(void) __interrupt(WDT_VECTOR)
{
    ticks_ms += 2;
    IRCON2 &= ~BV(4);
}

static void timer_init(void)
{
    WDCTL = BV(3) | BV(2) | 3;
    IEN2 |= BV(5);
    EA = 1;
}

static void delay_ms(uint16_t ms)
{
    uint32_t start = ticks_ms;

    while ((ticks_ms - start) < ms) {
    }
}

static void set_state(uint8_t p21, uint8_t p22)
{
    P2_1 = p21;
    P2_2 = p22;
}

void main(void)
{
    /* P2_1 + P2_2 output */
    P2DIR |= 0x06;

    timer_init();

    while (1) {

        /* STATE 1: oba LOW */
        set_state(0, 0);
        delay_ms(4000);

        /* kratka mezera - oba LOW */
        set_state(0, 0);
        delay_ms(1000);

        /* STATE 2 */
        set_state(1, 0);
        delay_ms(4000);

        set_state(0, 0);
        delay_ms(1000);

        /* STATE 3 */
        set_state(0, 1);
        delay_ms(4000);

        set_state(0, 0);
        delay_ms(1000);

        /* STATE 4 */
        set_state(1, 1);
        delay_ms(4000);

        /* dlouha mezera = konec celeho cyklu */
        set_state(0, 0);
        delay_ms(5000);
    }
}
