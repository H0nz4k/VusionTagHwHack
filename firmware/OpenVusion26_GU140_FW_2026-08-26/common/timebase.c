#include <cc2510fx.h>
#include <stdint.h>
#include "board.h"
#include "timebase.h"

/*
 * Same CC2510 WDT-timer mechanism used by the public VUSION4.2 demo.
 * One interrupt tick is approximately 2 ms.
 */
static volatile uint32_t g_ms = 0;

void timebase_isr(void) __interrupt(WDT_VECTOR)
{
    g_ms += 2u;
    IRCON2 &= (unsigned char)~BV(4);     /* clear WDT interrupt flag */
}

void timebase_init(void)
{
    WDCTL = (unsigned char)(BV(3) | BV(2) | 3u);  /* timer mode, ~2 ms */
    IEN2 |= BV(5);                               /* WDT interrupt enable */
}

uint32_t time_ms(void)
{
    uint32_t v;
    unsigned char old_ea = EA;
    EA = 0;
    v = g_ms;
    EA = old_ea;
    return v;
}

void delay_ms(uint16_t ms)
{
    uint32_t start = time_ms();
    while ((uint32_t)(time_ms() - start) < (uint32_t)ms) {
    }
}
