# BWR vzory 01–16

Displej EDG2-0260-A má tři fyzické barvy. Šedá, růžová a tmavá červená **nejsou** další RGB hodnoty. Jsou to pravidelné **1×1 px** vzory z bílé, černé a červené.

## Pravidla (OVĚŘENO v editoru)

- výsledný pixel je vždy přesně `#FFFFFF`, `#000000` nebo `#FF0000`;
- žádná alfa, žádné mezilehlé RGB, žádný bilinear scale;
- vzor se kreslí v ostré vrstvě **po** ditheringu rastrového obrázku a **znovu se neditheruje**;
- barva pixelu je `sample(patternId, canvasX, canvasY)` — globální souřadnice plátna, ne lokální počátek objektu;
- projekt ukládá stabilní `patternId`, ne matici tile.

Symboly tile:

| Znak | Barva | RGB |
| --- | --- | --- |
| `.` | bílá | 255,255,255 |
| `#` | černá | 0,0,0 |
| `@` | červená | 255,0,0 |

Lomítko v tabulce odděluje řádky periodického tile. Řádek 0 je nahoře, sloupec 0 vlevo. Fáze `(0,0)` je první znak prvního řádku.

## Registr

| # | ID | Tile | W / B / R % | Kategorie | Název |
| ---: | --- | --- | --- | --- | --- |
| 01 | `bwr-01-white` | `.` | 100 / 0 / 0 | solid | Plná bílá |
| 02 | `bwr-02-black` | `#` | 0 / 100 / 0 | solid | Plná černá |
| 03 | `bwr-03-red` | `@` | 0 / 0 / 100 | solid | Plná červená |
| 04 | `bwr-04-gray-25` | `..` / `#.` | 75 / 25 / 0 | white-black | Světle šedá |
| 05 | `bwr-05-gray-50` | `.#` / `#.` | 50 / 50 / 0 | white-black | Střední šedá |
| 06 | `bwr-06-gray-75` | `.#` / `##` | 25 / 75 / 0 | white-black | Tmavě šedá |
| 07 | `bwr-07-pink-25` | `..` / `.@` | 75 / 0 / 25 | white-red | Světle růžová |
| 08 | `bwr-08-red-50` | `@.` / `.@` | 50 / 0 / 50 | white-red | Střední červená |
| 09 | `bwr-09-red-75` | `@@` / `@.` | 25 / 0 / 75 | white-red | Sytá červená |
| 10 | `bwr-10-darkred-25` | `##` / `@#` | 0 / 75 / 25 | black-red | Tmavá červená |
| 11 | `bwr-11-redblack-50` | `@#` / `#@` | 0 / 50 / 50 | black-red | Červená a černá 50/50 |
| 12 | `bwr-12-red-black-25` | `@@` / `#@` | 0 / 25 / 75 | black-red | Červená s černým rastrem |
| 13 | `bwr-13-rgb-33` | `#@.` / `@.#` / `.#@` | 33⅓ / 33⅓ / 33⅓ | three-color | Tříbarevná diagonála |
| 14 | `bwr-14-w50-b25-r25` | `..` / `#@` | 50 / 25 / 25 | three-color | Bílá 50 % |
| 15 | `bwr-15-w25-b50-r25` | `##` / `@.` | 25 / 50 / 25 | three-color | Černá 50 % |
| 16 | `bwr-16-red50` | `@@` / `.#` | 25 / 25 / 50 | three-color | Červená 50 % |

Příklad vzorkování šachovnice 05: `(0,0)=bílá`, `(1,0)=černá`, `(0,1)=černá`, `(1,1)=bílá`.

## UI

Paleta výplně: solid 01–03 nahoře, potom skupiny 04–06, 07–09, 10–12, 13–16. Každá buňka má pixelový náhled a číslo. Tooltip: název, poměr W/B/R, popis.

Čísla 01–16 se do kresby **nevkládají**, kromě šablony BWR test (kontrastní rámeček + ostré číslo).

Na textu pod cca 12 px editor upozorní, že směs nemusí být čitelná. Volba zůstává povolená.

## Reference

Kanonický zdroj tile je registr v kódu. Obrazová reference (296×152, mřížka 4×4):

[`../testPIC/small_296x152/BWR_barevny_test_EDG2-0260-A_296x152.png`](../testPIC/small_296x152/BWR_barevny_test_EDG2-0260-A_296x152.png)

Fotografie `palete.jpeg` je doklad vzhledu na skle (perspektiva, komprese) — **ne** pixelová fixture.
