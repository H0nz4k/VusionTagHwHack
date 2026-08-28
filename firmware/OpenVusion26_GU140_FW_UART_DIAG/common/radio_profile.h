#ifndef OVH_RADIO_PROFILE_H
#define OVH_RADIO_PROFILE_H

/*
 * OVH_RF_PROFILE_0 — keep in sync with tools/rf_gateway/radio_profile.py
 * Provenience: docs/rf/RF_PROFILE_0.md (SWRS055G formulas/tables).
 */

#define OVH_RF_SYNC1     0x4F
#define OVH_RF_SYNC0     0x56
#define OVH_RF_PKTLEN    0x30
#define OVH_RF_PKTCTRL1  0x04
#define OVH_RF_PKTCTRL0  0x45
#define OVH_RF_ADDR      0x00
#define OVH_RF_CHANNR    0x00
#define OVH_RF_FSCTRL1   0x0A
#define OVH_RF_FSCTRL0   0x00
#define OVH_RF_FREQ2     0x5D
#define OVH_RF_FREQ1     0x93
#define OVH_RF_FREQ0     0xC0
#define OVH_RF_MDMCFG4   0x18
#define OVH_RF_MDMCFG3   0x93
#define OVH_RF_MDMCFG2   0x13
#define OVH_RF_MDMCFG1   0x23
#define OVH_RF_MDMCFG0   0x3B
#define OVH_RF_DEVIATN   0x44
#define OVH_RF_MCSM2     0x07
#define OVH_RF_MCSM1     0x00
#define OVH_RF_MCSM0     0x14
#define OVH_RF_PA_TABLE0 0x44
#define OVH_RF_TEST2     0x81
#define OVH_RF_TEST1     0x35

#define OVH_RFST_SFSTXON 0x00
#define OVH_RFST_SCAL    0x01
#define OVH_RFST_SRX     0x02
#define OVH_RFST_STX     0x03
#define OVH_RFST_SIDLE   0x04

#define OVH_MARC_IDLE    0x01
#define OVH_MARC_RX      0x0D
#define OVH_MARC_RXOVF   0x11
#define OVH_MARC_TX      0x13
#define OVH_MARC_TXUNF   0x16

#define OVH_TAG_ID_L     0x01u
#define OVH_RSSI_OFFSET  74

/* SDCC cc2510fx.h omits TEST* (SWRS055 0xDF23-0xDF25). */
#ifndef TEST2
#define TEST2 (*((__xdata volatile unsigned char *)0xDF23))
#define TEST1 (*((__xdata volatile unsigned char *)0xDF24))
#define TEST0 (*((__xdata volatile unsigned char *)0xDF25))
#endif

#endif
