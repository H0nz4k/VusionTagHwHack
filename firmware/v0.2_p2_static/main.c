#include <cc2510fx.h>

#ifndef P21_STATE
#define P21_STATE 0
#endif

#ifndef P22_STATE
#define P22_STATE 0
#endif

void main(void)
{
    /*
     * P2_1 a P2_2 jako GPIO.
     * P2_3/P2_4 se nedotykame.
     */
    P2SEL &= ~0x06;

    /* Nejprve nastav hodnotu latchu. */
#if P21_STATE
    P2 |= 0x02;
#else
    P2 &= ~0x02;
#endif

#if P22_STATE
    P2 |= 0x04;
#else
    P2 &= ~0x04;
#endif

    /* A teprve potom z nich udelej vystupy. */
    P2DIR |= 0x06;

    while (1) {
        /* staticky stav */
    }
}
