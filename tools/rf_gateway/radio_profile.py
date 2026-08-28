"""OVH_RF_PROFILE_0 — must match firmware/common/radio_profile.h"""

PROFILE_NAME = "OVH_RF_PROFILE_0"
F_XOSC_HZ = 26_000_000
FREQ_HZ = 2_433_000_000
DATA_RATE_NOM_BAUD = 10000
RX_BW_HZ = 406_250
DEVIATION_HZ = 38086
RSSI_OFFSET_DB = 74
PA_DBM = -30
SYNC_WORD = 0x4F56
MAX_PKTLEN = 48

# CC2510 XDATA 0xDF00+ names / CC2500 SPI addresses 0x00+
REGISTERS = {
    "SYNC1": 0x4F,
    "SYNC0": 0x56,
    "PKTLEN": 0x30,
    "PKTCTRL1": 0x04,
    "PKTCTRL0": 0x45,
    "ADDR": 0x00,
    "CHANNR": 0x00,
    "FSCTRL1": 0x0A,
    "FSCTRL0": 0x00,
    "FREQ2": 0x5D,
    "FREQ1": 0x93,
    "FREQ0": 0xC0,
    "MDMCFG4": 0x18,
    "MDMCFG3": 0x93,
    "MDMCFG2": 0x13,
    "MDMCFG1": 0x23,
    "MDMCFG0": 0x3B,
    "DEVIATN": 0x44,
    "MCSM2": 0x07,
    "MCSM1": 0x00,
    "MCSM0": 0x14,
    "PA_TABLE0": 0x44,
    "TEST2": 0x81,
    "TEST1": 0x35,
}

# MCSM2 left at typical silicon reset 0x07 (RX_TIME etc.) — SWRS055 reset; confirm RF-A dump.
WRITE_ORDER = [
    "SYNC1", "SYNC0", "PKTLEN", "PKTCTRL1", "PKTCTRL0", "ADDR", "CHANNR",
    "FSCTRL1", "FSCTRL0", "FREQ2", "FREQ1", "FREQ0",
    "MDMCFG4", "MDMCFG3", "MDMCFG2", "MDMCFG1", "MDMCFG0", "DEVIATN",
    "MCSM2", "MCSM1", "MCSM0", "PA_TABLE0", "TEST2", "TEST1",
]

# CC2500 SPI config addresses (SWRS040 Table 35)
SPI_ADDR = {
    "SYNC1": 0x00, "SYNC0": 0x01, "PKTLEN": 0x02, "PKTCTRL1": 0x03, "PKTCTRL0": 0x04,
    "ADDR": 0x05, "CHANNR": 0x06, "FSCTRL1": 0x07, "FSCTRL0": 0x08,
    "FREQ2": 0x09, "FREQ1": 0x0A, "FREQ0": 0x0B,
    "MDMCFG4": 0x0C, "MDMCFG3": 0x0D, "MDMCFG2": 0x0E, "MDMCFG1": 0x0F, "MDMCFG0": 0x10,
    "DEVIATN": 0x11, "MCSM2": 0x16, "MCSM1": 0x17, "MCSM0": 0x18,
    "PA_TABLE0": 0x3E,  # PATABLE index 0 via PATABLE access; also mapped 0x2E in some tables
    "TEST2": 0x2C, "TEST1": 0x2D, "TEST0": 0x2E,
}

# PATABLE on CC2500 is special (0x3E). Config register 0x2E is TEST0.
# PA_TABLE0 on CC2510 is 0xDF2E. SPI 0x2E is TEST0 on CC2500.
# Write PA via PATABLE burst 0x3E; write TEST2/TEST1 at 0x2C/0x2D.
CC2500_SPI_WRITE = {
    "SYNC1": 0x00, "SYNC0": 0x01, "PKTLEN": 0x02, "PKTCTRL1": 0x03, "PKTCTRL0": 0x04,
    "ADDR": 0x05, "CHANNR": 0x06, "FSCTRL1": 0x07, "FSCTRL0": 0x08,
    "FREQ2": 0x09, "FREQ1": 0x0A, "FREQ0": 0x0B,
    "MDMCFG4": 0x0C, "MDMCFG3": 0x0D, "MDMCFG2": 0x0E, "MDMCFG1": 0x0F, "MDMCFG0": 0x10,
    "DEVIATN": 0x11, "MCSM2": 0x16, "MCSM1": 0x17, "MCSM0": 0x18,
    "TEST2": 0x2C, "TEST1": 0x2D,
}

CC2510_RFST = {"SFSTXON": 0x00, "SCAL": 0x01, "SRX": 0x02, "STX": 0x03, "SIDLE": 0x04}
CC2500_STROBE = {
    "SRES": 0x30, "SFSTXON": 0x31, "SXOFF": 0x32, "SCAL": 0x33,
    "SRX": 0x34, "STX": 0x35, "SIDLE": 0x36, "SAFC": 0x37,
    "SWOR": 0x38, "SPWD": 0x39, "SFRX": 0x3A, "SFTX": 0x3B,
    "SWORRST": 0x3C, "SNOP": 0x3D,
}

MARC_IDLE = 0x01
MARC_RX = 0x0D
MARC_RXOVF = 0x11
MARC_TX = 0x13
MARC_TXUNF = 0x16
