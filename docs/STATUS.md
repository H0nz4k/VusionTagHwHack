# STATUS — GU140 výzkum

**Mission:** dokumentace celého stacku + připrava velkého tagu / RF  
**Branch:** `research/gu140`  
**Target:** DEV only. Stock/golden bez souhlasu.

## Now

Kompletní zpráva: [`PROJECT.md`](PROJECT.md). Inventář `tools/`: [`SOFTWARE.md`](SOFTWARE.md).

EPD first-content **OVĚŘENO** (EXP-033). NFC SHOW + mailbox **OVĚŘENO** v sourozenci `feature/tagset` (EXP-038…071). RF OTA **ne** (chybí CC2500). Velký tag TAG2 čeká na lidské potvrzení zapojení pin 2↔9.

Tento checkout má EPD FW `v0.3*`–`v0.4l`. Novější NFC/RF hex jsou v `tools/Debugger/OpenVusion_GU140_Cursor_Agent_Project`.

## Žebříky

### EPD

| Step | EXP | Result |
|---|---|---|
| A–H first refresh | 022–029 | PASS UART; BUSY po `0x12` |
| I B/W pruhy | 030 | **OVĚŘENO vizuálně** |
| J stride 37 | 031 | diagonály |
| K 19 B/row | 032 | **OVĚŘENO** B\|W\|R |
| L OpenVusionHack | 033 | **OVĚŘENO vizuálně** |

### NFC (sourozenec)

| Step | EXP | Result |
|---|---|---|
| I²C ACK 0xAA | 040+ | **PASS** |
| SHOW 1–4 TWN4 | 054–056 | **PASS** sklo |
| SRAM / OVMB | 063–067 | **PASS** |
| 11248 B → 0x12 | 068–069 | **PASS** sklo |
| tag-send-image / TagSet | 070–071 | **PASS** host |

### RF

| Step | EXP | Result |
|---|---|---|
| A–C dump/IDLE/RX | 034–036 | **PASS** UART |
| D TX ping | 037 | FAIL / OTA ne |
| E–G CC2500 | — | **BLOK** hardware |
