# Image transfer (design only)

Do **not** implement until RF-G addressing + SHOW_DEMO are stable.

## Size

```text
5624 B plane10 + 5624 B plane13 = 11248 B
```

CC2510 RAM na celý obraz nestačí. Chunky.

## v1 reliability (sequential)

```text
IMAGE_BEGIN (id, 152×296, BWR, total, crc32)
  wait ACK
IMAGE_CHUNK i  (strict i = last+1)
  wait ACK i
IMAGE_END (crc32)
  wait ACK
```

Ztráta / duplicita / out-of-order: retry chunku, ne window. Abort + tag restart → nový BEGIN.

Gateway restart: nový session id, tag zahodí partial.

## Staging

**A — external flash (preferred later).** GU140 flash piny jsou **REFERENCE** (P1_4 CS, P1_5 SCLK, P1_6 MOSI, P1_7 MISO). P1_6 je teď UART TX. Neověřeno. Nejdřív identity/read ID.

**B — stream do CoG.** Riziko držet DCDC během dlouhého RF. Ne, dokud timing.

**C — MCU flash.** Endurance; ne default.

SHOW_DEMO mezikrok: RF command → už zkompilovaný OpenVusionHack, žádný transfer.
