# CC2510 radio notes

Source: SWRS055G, DN107 SWRA164A, SDCC `cc2510fx.h` on lab Pi.

## SFR / XDATA (OVĚŘENO v headeru)

| Symbol | Addr | Role |
|---|---|---|
| `RFD` | SFR 0xD9 / XDATA 0xDFD9 | one-byte radio data |
| `RFST` | SFR 0xE1 | command strobe |
| `RFIF` | SFR 0xE9 | RF event flags (R/W0) |
| `RFIM` | SFR 0x91 | RF interrupt mask |
| `RFTXRXIF` | `TCON.1` | byte ready on `RFD` |
| `RFTXRXIE` | `IEN0.0` | enable RFTXRX IRQ |
| `IEN2.RFIE` | | enable general RF IRQ (with `S1CON.RFIF`) |

Config/status: `SYNC1`…`PA_TABLE0` at `0xDF00`…, `PARTNUM` `0xDF36`, `VERSION` `0xDF37`, `RSSI` `0xDF3A`, `MARCSTATE` `0xDF3B`, `PKTSTATUS` `0xDF3C`.

## MARCSTATE (SWRS055)

| Value | Name |
|---|---|
| 0x01 | IDLE |
| 0x0D | RX |
| 0x11 | RX_OVERFLOW |
| 0x13 | TX |
| 0x16 | TX_UNDERFLOW |

Reset MARC_STATE = IDLE (00001).

## Strobes (`RFST`)

0x00 SFSTXON, 0x01 SCAL, 0x02 SRX, 0x03 STX, 0x04 SIDLE. Jiné = SNOP.

SIDLE maže pending strobes, dokud radio nedojde do IDLE (SWRS055 §13.1 note).

## `RFD` / `RFTXRXIF` (kritické)

- TX: `RFTXRXIF` se **neassertuje před STX**. Po STX: čekat flag, **clear BEFORE write** `RFD` (SWRS055 §13.3).
- RX: flag = byte k přečtení. Clear **před** čtením `RFD`, jinak APPEND_STATUS může spolkout druhý status byte (stejný odstavec).
- Žádný 64 B FIFO. Podtečení → TX_UNDERFLOW, přetečení → RX_OVERFLOW. Zotavení: SIDLE, clear flags, ne MCU reset.

DN107: DMA trigger RADIO, SRC/DEST `RFD` vs XDATA buffer. VLEN chyby umí zamknout RX — číst DN107 před DMA.

## RFIF bits (SWRS055 §13.3.1.2)

TXUNF, RXOVF, TIMEOUT, DONE, CS, PQT, CCA, SFD. Rising-edge. Clear write-0.

Nekombinovat dlouhý UART print v per-byte ISR.

## RSSI timing

Platná hodnota až po vstupu do RX; po sync word freeze. DN505 = response time. Offset Table 68.

## Errata / read corruption

CC2500 family: některé status registry (MARCSTATE, TXBYTES analog) mohou při čtení za běhu vrátit jednou poškozený byte. Na IDLE dump po resetu je riziko nízké; při RX číst RSSI opatrně, případně dvakrát.

## P1 GDO vs UART

`IOCFG1` řídí P1_6. **Nezapisovat** — P1_6 je diagnostický UART TX.

P2_3/P2_4 nikdy GPIO. P0_3 není UART.

## Reset defaults worth checking (RF-A)

| Reg | Reset (SWRS055) |
|---|---|
| SYNC1/0 | 0xD3 / 0x91 |
| PKTCTRL0 | WHITE=1 CRC=1 VARLEN → 0x45 |
| PKTCTRL1 | APPEND=1 ADR=00 → 0x04 |
| PA_TABLE0 | 0x00 |
| RSSI | 0x80 |
| MARCSTATE | IDLE |

PARTNUM/VERSION radio ID: **zaznamenat z siliconu**, nehádáme.
