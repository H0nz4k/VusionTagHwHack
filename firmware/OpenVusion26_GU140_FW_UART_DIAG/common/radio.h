#ifndef OVH_RADIO_H
#define OVH_RADIO_H
#include <stdint.h>

void radio_idle(void);
void radio_apply_profile(void);
uint8_t radio_wait_marc(uint8_t want, uint16_t spins);
uint8_t radio_calibrate(void);
void radio_recover(void);
void radio_dump_key(void);
uint8_t radio_marc(void);

#endif
