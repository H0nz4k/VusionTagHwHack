# PNG, BIN, C a mapování rovin

Náhled, statistiky palety, PNG, BIN i C vycházejí **ze stejného** indexovaného bitmapu po ostrém overlay. Opakovaný export stejných dat je byte-for-byte deterministický.

## PNG

Přesné rozlišení plátna, 8bit RGB bez alphy, jen tři barvy palety.

## Velikost BIN (dvě souvislé 1bit roviny, bez hlavičky)

| Profil | Na šířku | 1 rovina | 2 roviny |
| --- | ---: | ---: | ---: |
| EDG2-0260-A | 296×152 | 5 624 B | **11 248 B** |
| EDG2-0420-B | 400×300 | 15 000 B | 30 000 B |

Packování: po řádcích, výchozí **MSB-first** (první pixel řádku = bit 7).

## `planeMap`

Hodnoty `0x10` a `0x13` jsou **příkazy CoG**, ne bajty obrazových dat. Do BIN se nevkládají.

### `legacy` (výchozí, kompatibilita v0.1/v0.2)

OVĚŘENO proti `dithered_image.png` + `image_data_array.c`.

| Barva | Rovina A | Rovina B |
| --- | ---: | ---: |
| bílá | 1 | 1 |
| černá | 0 | 1 |
| červená | 0 | 0 |

Kombinace A=1 B=0 je při běžném exportu neplatná (dekód = magenta).

Toto **není** totéž mapování jako naměřené CoG. Nejde ho získat pouhou inverzí nebo prohozením rovin legacy kodeku.

### `cog-edg2-0260-a` (pojmenovaná předvolba)

Logické mapování naměřené na CoG EDG2-0260-A (rovina A = příkaz `0x10`, rovina B = `0x13`):

| Barva | PNG RGB | 0x10 | 0x13 |
| --- | --- | ---: | ---: |
| bílá | 255,255,255 | 0 | 0 |
| černá | 0,0,0 | 1 | 0 |
| červená | 255,0,0 | 0 | 1 |

Kombinace 1/1 je neplatná.

Sestavení BIN touto předvolbou a vykreslení na fyzickém tagu **zatím není OVĚŘENO**. Volba je v pokročilém exportu; výchozí projekty zůstávají `legacy`.

Firmware streamuje roviny příkazy `0x10` a `0x13` (každá 5624 B u 296×152). Viz kořenový [`docs/nfc/SHOW_SLOTS.md`](../../../docs/nfc/SHOW_SLOTS.md) a kapitola B/W/R encoding v [`README.md`](../../../README.md) repozitáře.

## C soubor

```c
const unsigned char gImage[] = { ... };
const unsigned int gImageSize = sizeof(gImage);
```

Nikdy hardcoded velikost pole. Volitelně SDCC `__code`. Komentář v hlavičce uvádí, zda šlo o legacy nebo CoG mapování.

## Pokročilé transformace

LSB-first, pořadí rovin A/B, inverze A/B, otočení 0/90/180/270, flip X/Y, název C pole. Diagnostika zpětně dekóduje BIN a porovná ho s náhledem.
