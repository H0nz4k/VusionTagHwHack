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

Na GU140 je toto zatím REFERENCE/HYPOTÉZA.

Neprováděj zápisy do NFC/config prostoru, dokud není ověřena základní I2C komunikace a identita zařízení.
