# OVH RF protocol v0.1

Laboratory protocol. **NOT AUTHENTICATED. NOT ENCRYPTED. NOT FOR SECURITY-SENSITIVE COMMANDS.**

CC2510 má AES akcelerátor; flags/version nechávají prostor na pozdější autentizovaný typ. Žádná domácí kryptografie.

Hardware radio CRC (PKTCTRL0.CRC_EN) chrání PHY PDU. Druhý per-packet CRC se nepřidává. Celý obraz později: transfer CRC v `IMAGE_END`.

## PHY wrapping

Variable length (PKTCTRL0.LENGTH_CONFIG=01):

```text
[ length = N ] [ N bytes application PDU ] [ 2 B radio CRC ]
```

`N` = velikost PDU (header + payload), **bez** length byte a **bez** radio CRC. Max `N` = `PKTLEN` (48).

Address filtering v rádiu je v0.1 **vypnuté** (PKTCTRL1.ADR_CHK=00). Destinace je v PDU.

## Application PDU

Little-endian.

```text
offset  size  field
0       3     magic     "OVH"
3       1     version   1
4       1     type
5       4     dest_id
9       4     src_id
13      2     seq
15      1     flags
16      0-24  payload
```

Header = 16 B. Max payload = 24 B. Max PDU = 40 B.

## Addresses

| ID | Význam |
|---|---|
| `0x00000000` | neplatné |
| `0x00000001` | DEV bench tag (compiled) |
| `0xFFFFFFFE` | reserved gateway |
| `0xFFFFFFFF` | broadcast |

Broadcast v0.1: přijmout jen `PING` a `STATUS_REQ`. Viditelné akce (`SHOW_DEMO`, image) **ne**. Unicast: `dest_id` musí sedět, jinak drop (volitelně NACK jen pokud flags.NEED_ACK a dest byl „skoro“ — v0.1: drop without TX, ať cizí ID nezpůsobí RF šum).

Gateway ID v0.1: `0x00000002`.

## Frame types

Implemented in host codec:

| Value | Name | Payload |
|---|---|---|
| 0x01 | PING | optional 0–8 B nonce |
| 0x02 | PONG | echo nonce |
| 0x03 | STATUS_REQ | empty |
| 0x04 | STATUS | TBD small |
| 0x05 | ACK | 1 B acked type + 2 B seq |
| 0x06 | NACK | 1 B code |

Reserved (codec accepts as type, firmware must not execute tonight):

| Value | Name |
|---|---|
| 0x10 | SHOW_DEMO |
| 0x11 | IMAGE_BEGIN |
| 0x12 | IMAGE_CHUNK |
| 0x13 | IMAGE_END |
| 0x14 | IMAGE_ABORT |
| 0x15 | REFRESH |
| 0x16 | SLEEP |

Unknown type → decode error.

## Flags

```text
bit0 NEED_ACK
bit1 DUPLICATE_REPLY  (tag resending cached ACK)
bit2-6 reserved 0
bit7 SEC_PRESENT      must be 0 in v0.1; future AEAD
```

## ACK / retry / duplicate

Gateway: `seq=N`, wait ACK/PONG with same seq, max 3 attempts, bounded timeout (default 200 ms — **změřit**, nevěřit).

Tag: vykonat unicast command jednou na `(src, seq)`. Retransmit stejného seq → znovu poslat cached odpověď, **ne** druhý EPD refresh.

NACK codes: `0x01` version, `0x02` dest, `0x03` type, `0x04` length, `0x05` busy, `0x06` unsupported.

## Logging

Tag UART (ASCII, bounded hex):

```text
RF RX seq=0042 type=PING len=8 rssi=-61 lqi=93 crc=1
RF TX seq=0042 type=PONG len=8
RF ERR RX_OVERFLOW
```

Gateway JSONL optional: `{"event":"rx","seq":42,"type":"PONG","rssi":-61,"lqi":93,"crc":true}`
