# NFC SHOW sloty (v0.10g)

Firmware strom `firmware/OpenVusion26_GU140_FW_UART_DIAG/v0.10e_nfc_show3/` (banner **EXP-056 v0.10g**). Hex: `firmware/releases/v0.10e_nfc_show3.hex`. ROM **29896 / 32768**.

Host: `/home/hw/bin/ov26-nfc-show.sh` → TWN4 zapíše NTAG page `0x30` = `OVH` + n.

| Volba | Grafika | Sklo |
|---|---|---|
| 1 | OpenVusionHack (v0.4l RLE) | — |
| 2 | BWR paleta 01–16 | [`captures/ov26_exp054_slot2_palette_glass.png`](../../captures/ov26_exp054_slot2_palette_glass.png) |
| 3 | Shut up and take my money (TagStudio zip `2026-08-28_22-28-47`) | [`captures/ov26_exp056_slot3_glass.png`](../../captures/ov26_exp056_slot3_glass.png) |
| 4 | Smazat / bílá (5624× `0x00` do `0x10` i `0x13`) | bez bitmapy |

LED bliká jen při latchi příkazu. Zhasne = sundej TWN4. EPD ještě ~15 s.

## Paleta volby 2 — hodnoty 01–16

Zdroj: `tools/TagStudio/testPIC/small_296x152/BWR_barevny_test_EDG2-0260-A_296x152.png` (296×152, 4×4 pole). Editor: [`tools/TagStudio/README.md`](../../tools/TagStudio/README.md). Jen RGB bílá `(255,255,255)` / černá `(0,0,0)` / červená `(255,0,0)`. CoG: WHITE p10=0 p13=0, BLACK p10=1 p13=0, RED p10=0 p13=1.

```text
01  02  03  04
05  06  07  08
09  10  11  12
13  14  15  16
```

| # | Vzor (1 px) | W/B/R % | Vizuálně |
|---|---|---|---|
| 01 | plná bílá | 100/0/0 | solid white |
| 02 | plná černá | 0/100/0 | solid black |
| 03 | plná červená | 0/0/100 | solid red |
| 04 | lichý řádek `#.#.` černá na bílé, sudý bílá | 75/25/0 | světle šedá |
| 05 | šachovnice černá/bílá | 50/50/0 | střední šedá |
| 06 | lichý plná černá, sudý `.#.#` | 25/75/0 | tmavě šedá |
| 07 | lichý `.@.@` červená na bílé, sudý bílá | 75/0/25 | světle růžová |
| 08 | šachovnice červená/bílá | 50/0/50 | střední červená |
| 09 | lichý `@.@.` na červené, sudý plná červená | 25/0/75 | sytá červená |
| 10 | lichý plná černá, sudý `@#@#` | 0/75/25 | tmavá červená |
| 11 | šachovnice červená/černá | 0/50/50 | red+black 50/50 |
| 12 | lichý `#@#@` na červené, sudý plná červená | 0/25/75 | červená + černý stipple |
| 13 | diagonála periody 3: černá, červená, bílá | ~33/33/33 | tříbarevná šikmá |
| 14 | lichý bílá, sudý `#@#@` | 50/25/25 | pruhy bílá \| černá+červená |
| 15 | lichý černá, sudý `@.@.` | 25/50/25 | pruhy černá \| červená+bílá |
| 16 | lichý červená, sudý `.#.#` | 25/25/50 | pruhy červená \| černá+bílá |
