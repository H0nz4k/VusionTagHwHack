# NFC architecture

```text
application / ovh-nfc CLI
        │
ELATEC TWN4  (/dev/ttyACM0, VID 09d8)
        │  13.56 MHz
NTAG I²C Plus 1K  (GET_VERSION 00 04 04 05 02 02 13 03)
        │  I2C write 0xAA  OVĚŘENO EXP-040
CC2510
        │  existing EPD SPI path
E2266JS0C2
```

MCU piny:

```text
P0_4 SDA   P0_6 SCL     OVĚŘENO (ACK 0xAA)
P1_0 NFC power?         REFERENCE (nepotřeba pro ACK)
P1_1 FD?                REFERENCE
```

I2C session `0xFE` write-pointer ACK **OVĚŘENO**; read address `0xAB` NACK (EXP-043/044). SRAM mailbox až po ACKAB=1.

64 B SRAM (I2C `F8–FB` / RF `F0–FF` až po PTHRU) — NXP NT3H2111. Stock Vusion dynamická A/B pole se **neimplementují**.

Protokol v mailboxu později: stejný duch jako OVH RF v0.1 (`docs/rf/PROTOCOL.md`), max ~48 B payload ve 64 B okně.

EPD se nekopíruje; SHOW_DEMO volá známý-good refresh.
