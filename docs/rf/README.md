# OpenVusionHack RF

Vlastní 2.4 GHz protokol mezi Raspberry Pi gateway a GU140 / CC2510.

**Není** reverse-engineering originálního Vusion/SoluM RF.

```text
Pi / CC2500 gateway  --OVH RF v0.1-->  GU140 CC2510  --> UART proof
                                                     --> later EPD command
```

## Stav

| Položka | Klasifikace |
|---|---|
| EPD B/W/R + OpenVusionHack | **OVĚŘENO** (`milestone/display-first-content`) — RF to nesmí rozbít |
| CC2510 radio SFR mapa | **REFERENCE** TI SWRS055 + SDCC `cc2510fx.h` |
| RF-A dump / RF-B IDLE / RF-C RX | **OVĚŘENO** UART EXP-034..036 |
| `OVH_RF_PROFILE_0` write/readback | **OVĚŘENO** EXP-035 |
| Host protokol v0.1 | unit testy, bez rádia |
| CC2500 na lab Pi | **není přítomen** (žádný `/dev/spidev*`) |
| GU140 TX / OTA PING | EXP-037 UART FAIL; OTA neprovedeno |

## Dokumenty

| Soubor | Obsah |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | brána, tag, milníky, image later |
| [PROTOCOL.md](PROTOCOL.md) | OVH RF v0.1 |
| [RF_PROFILE_0.md](RF_PROFILE_0.md) | PHY registry + provenience |
| [CC2510_RADIO_NOTES.md](CC2510_RADIO_NOTES.md) | RFD vs CC2500 FIFO, strobes, ISR |
| [GATEWAY_CC2500.md](GATEWAY_CC2500.md) | SPI, pin config, probe |
| [IMAGE_TRANSFER.md](IMAGE_TRANSFER.md) | návrh, ne implementace |

Kód: `tools/rf_gateway/`, firmware `firmware/OpenVusion26_GU140_FW_UART_DIAG/v0.5*_rf_*`.

## Žebřík

```text
RF-A dump  →  RF-B IDLE init  →  RF-C bounded RX/RSSI
→  RF-D short TX (OTA NOT VERIFIED bez přijímače)
→  RF-E CC2500 probe  →  RF-F CC2500↔CC2500  →  RF-G GU140 PING/PONG
```

`milestone/rf-first-packet` jen po **obousměrném** OTA důkazu.
