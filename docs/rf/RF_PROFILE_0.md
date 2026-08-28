# OVH_RF_PROFILE_0

Conservative packet GFSK for CC2510 **and** CC2500 modem cores. Not a SmartRF Studio export.

**Rozhodnutí:** ~10 kBaud, ne 250 kBaud.

Důvod: SWRS055 §13.5 (CPU musí stíhat `RFD`); DN021/E2E — širší RX filtr a nižší rate snáší crystal offset. 250 kBaud je validní pozdější profil, ne první ISR/polling bring-up.

Všechny zapisované konstanty: vzorec nebo tabulka z **SWRS055G** (CC2510), `f_xosc = 26 MHz` (stejný XOSC jako UART baseline).

## Summary

| Parameter | Value | Provenience |
|---|---|---|
| Carrier | 2433.000 MHz, CHANNR=0 | FREQ = f·2^16/f_xosc → `0x5D93C0` |
| Channel spacing | 249.9 kHz | MDMCFG1/0 CHANSPC, §13.12 formula |
| Modulation | GFSK | MDMCFG2.MOD_FORMAT=001 |
| Data rate | 9.993 kBaud | DRATE_E=8, DRATE_M=0x93, §13.5 |
| Deviation | 38.09 kHz | DEVIATN=0x44; datasheet 10 kBaud typ. 38.2 kHz |
| RX filter BW | 406 kHz | Table 62 CHANBW_E=00 M=01 (širší než 232 kHz kvůli ppm) |
| IF | 253.9 kHz | FSCTRL1=0x0A, f_xosc·FREQ_IF/2^10 |
| Preamble | 4 B | MDMCFG1.NUM_PREAMBLE=010 |
| Sync | `0x4F56` (`OV`) | custom; **ne** reset `0xD391` |
| Sync qual | 30/32 bits | MDMCFG2.SYNC_MODE=011 |
| Packet | variable length | PKTCTRL0.LENGTH_CONFIG=01 (reset) |
| Whitening | on | PKTCTRL0.WHITE_DATA=1 (reset) |
| CRC | on, CC2500-family | PKTCTRL0.CRC_EN=1 (reset) |
| Addr filter | off | PKTCTRL1.ADR_CHK=00; dest v PDU |
| Append status | on | PKTCTRL1.APPEND_STATUS=1 (RSSI/LQI/CRC_OK) |
| CCA | always | MCSM1.CCA_MODE=00 so first TX isn't gated |
| RX/TX off | IDLE | MCSM1 RXOFF/TXOFF=00 |
| Autocal | IDLE→RX/TX | MCSM0.FS_AUTOCAL=01, bits3:0=0100 → `0x14` |
| TX power | −30 dBm | PA_TABLE0=`0x44` Table 72 |
| Max length | 48 | PKTLEN |
| TEST2/TEST1 | `0x81` / `0x35` | ≤100 kBaud sensitivity note, SWRS055 TEST regs |
| IOCFG0/1/2 | **not written** | P1_6 = UART TX; P1_4–P1_7 flash candidates |

FOCCFG / BSCFG / AGCCTRL / FSCAL / FREND: **neplníme SmartRF hodnotami**. Zůstávají silicon reset + výsledek SCAL. OTA citlivost tím pádem HYPOTÉZA, dokud nebude SmartRF export nebo naměřený link.

## Write list (host + tag must match)

Viz `tools/rf_gateway/radio_profile.py` a `firmware/.../common/radio_profile.h`. Test `test_profile_consistency.py` hlídá drift.

## RSSI

SWRS055 §13.10.3 Table 68: RSSI_offset = **74 dB** at 10 kBaud.

```text
if rssi_dec >= 128:  dBm = (rssi_dec - 256)/2 - 74
else:                dBm = rssi_dec/2 - 74
```

## CC2500 SPI vs CC2510 RFST

| Name | CC2510 `RFST` | CC2500 SPI strobe |
|---|---|---|
| SFSTXON | 0x00 | 0x31 |
| SCAL | 0x01 | 0x33 |
| SRX | 0x02 | 0x34 |
| STX | 0x03 | 0x35 |
| SIDLE | 0x04 | 0x36 |
| SRES | n/a (MCU reset) | 0x30 |

Nepřekládat čísla 1:1.
