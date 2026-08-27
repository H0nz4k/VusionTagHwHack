#include <cc2510fx.h>
#include "clock.h"

/*
 * CC2510 CLKCON (SWRS055):
 *   bit7 OSC32K, bit6 OSC, bits2:0 CLKSPD
 * OSC=0 -> 26 MHz XOSC, OSC=1 -> 13 MHz HS RCOSC
 * CLKSPD=000 -> no divide (26 MHz or 13 MHz depending on OSC)
 */
void clock_init_26mhz(void)
{
    SLEEP &= (unsigned char)~0x04u;      /* OSC_PD = 0, power up both HS osc */
    while (!(SLEEP & 0x40u)) {}          /* wait XOSC_STB */
    CLKCON = (unsigned char)(CLKCON & (unsigned char)~0x47u); /* OSC=0, CLKSPD=000 */
    while (CLKCON & 0x40u) {}            /* wait until OSC=0 (XOSC selected) */
    SLEEP |= 0x04u;                      /* OSC_PD=1, power down unused HS RCOSC */
}

void clock_init_hsrc_13mhz(void)
{
    /*
     * Stay on HS RCOSC. Do not start XOSC.
     * Force CLKSPD=000 so f_sys ~= 13 MHz (reset default is CLKSPD=001 -> ~6.5 MHz).
     * OSC_PD stays 1: unused oscillator (XOSC) remains powered down.
     */
    CLKCON = (unsigned char)((CLKCON & (unsigned char)~0x07u) | 0x40u);
    while (!(CLKCON & 0x40u)) {}         /* wait until OSC=1 (HS RCOSC) */
}
