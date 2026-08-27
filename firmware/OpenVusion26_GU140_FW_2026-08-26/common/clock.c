#include <cc2510fx.h>
#include "clock.h"

/*
 * TI CC2510 reference sequence:
 * - power up HS crystal
 * - wait for XOSC stable
 * - select XOSC, divide-by-1 (26 MHz)
 * - wait until switch completes
 * - power down unused HS RC oscillator
 */
void clock_init_26mhz(void)
{
    SLEEP &= (unsigned char)~0x04u;      /* OSC_PD = 0 */
    while (!(SLEEP & 0x40u)) {          /* XOSC_STB */
    }

    CLKCON = (unsigned char)(CLKCON & (unsigned char)~0x47u);
    while (CLKCON & 0x40u) {            /* OSC must become 0 = XOSC */
    }

    SLEEP |= 0x04u;                      /* power down unused HS oscillator */
}
