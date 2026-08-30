# NFC Reference

Reference z příbuzného VUSION 4.2:

```text
P0_4 -> SDA
P0_6 -> SCL
```

I2C 8-bit adresy:

```text
write 0xAA
read  0xAB
```

Reference uvádí:
- config page `0x3A`
- session page `0xFE`
- SRAM blocks `F8..FB`
- 4 × 16 B = 64 B SRAM mailbox
- aplikační payload kolem 60 B + metadata/CRC.

Na GU140 je I²C + SHOW + mailbox **OVĚŘENO** (sourozenec EXP-040…071). Souhrn: [`nfc/README.md`](nfc/README.md).

Stock NDEF/SES protokol neimplementujeme. Na stock/golden nezapisovat config/password.

```text
P0_4 SDA  P0_6 SCL  P1_1 FD     OVĚŘENO
I2C 0xAA / 0xAB                 OVĚŘENO
NTAG I²C Plus 1K UID 04367F5A2D7280
SHOW: OVH@0x30 nebo NDEF Text 1–4
Mailbox OVMB: 11248 B přes SRAM F8–FB
```
