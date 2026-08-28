# TAG Studio 0.3.0

Lokální editor tříbarevné grafiky (bílá / černá / červená) pro elektronické cenovky Vusion. Běží v prohlížeči, **neodesílá obrázky ani projekty na internet** a nepotřebuje backend, účet ani API klíč.

Verze `0.3.0` · credit **HanzG**.

Podrobná dokumentace:

- [docs/README.md](docs/README.md) — přehled
- [docs/BWR_PATTERNS.md](docs/BWR_PATTERNS.md) — vzory 01–16
- [docs/TEMPLATES.md](docs/TEMPLATES.md) — šablony
- [docs/SCHEMA.md](docs/SCHEMA.md) — `project.tagstudio.json` schema 3
- [docs/CODEC.md](docs/CODEC.md) — PNG / BIN / C, legacy vs CoG

## Požadavky

- Windows, Node.js 20+ (ověřeno s Node 22) a npm
- aktuální **Chrome** nebo **Edge** (File System Access API pro přímý zápis do složky)
- ostatní prohlížeče: stejný editor, ukládání přes stažení / ZIP

Doporučené stabilní URL (neměňte port — oprávnění File System Access a IndexedDB jsou svázané s originem):

- vývoj: http://127.0.0.1:5173
- produkční náhled: http://127.0.0.1:4173

`localhost` a `127.0.0.1` jsou různé originy. Používejte vždy `127.0.0.1`.

## Instalace závislostí

V adresáři `tools/TagStudio`:

```bat
npm install
```

Nebo spusťte `start.cmd` — při chybějícím `node_modules` závislosti doinstaluje.

## Vývoj

```bat
npm run dev
```

Otevře http://127.0.0.1:5173 (pevný port, bez náhodného čísla).

Pomocný skript:

```bat
start.cmd
```

PowerShell: `.\start.ps1`

Stejný origin: `npm start`

## Produkční build a lokální spuštění

```bat
npm run build
npm run preview
```

Aplikace se obsluhuje z `http://127.0.0.1:4173`. Složka `dist/` je statická a po sestavení funguje i bez internetu. `base` je relativní (`./`).

Kontroly:

```bat
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

## Základní pracovní postup

1. **Nový** — zvolte vestavěnou šablonu. V Chrome/Edge pak vyberte hlavní pracovní složku. TAG Studio v ní vytvoří podsložku `TAG_Project_YYYY-MM-DD_HH-mm-ss` (místní čas) a zapíše `project.tagstudio.json`.
2. Zvolte profil tagu (EDG2-0260-A 296×152 nebo EDG2-0420-B 400×300) a orientaci. Šablona **BWR barevný test 01–16** je vázaná na 296×152.
3. Přidejte obrázek (tlačítko nebo přetažení PNG/JPEG/WebP). Průhlednost se skládá na bílé.
4. Upravte výřez, velikost, otočení, jas/kontrast/sytost a citlivost červené.
5. Zvolte dithering (pro komiksy/memy doporučen **BWR dvoufázový** + Atkinson). Vzory palety se **znovu neditherují**.
6. Přidejte ostrý text (česká diakritika, Inter OFL) nebo obdélník / čáru. Výplň může být solidní barva nebo BWR vzor 01–16.
7. **Uložit projekt** / **Exportovat vše** zapíše JSON, PNG, BIN a C do aktivní projektové složky.
8. Starý projekt otevřete přes **Otevřít** (soubor) nebo **Otevřít složku**.

Zoom a posun plátna **nemění** exportované pixely. Pixelová mřížka je jen pomůcka. Bezpečný okraj (výchozí 6 px) se neexportuje.

Klávesy: `Delete`, `Ctrl+Z`, `Ctrl+Y` / `Ctrl+Shift+Z`, `Ctrl+S`, `Ctrl+O`, šipky (s `Shift` po 10 px).

## Projektové složky a oprávnění

Prohlížeč **nemůže** bez vašeho souhlasu zapisovat kamkoli na disk. V Chrome a Edge po kliknutí na **Nový** aplikace požádá o hlavní pracovní složku (`showDirectoryPicker`). Teprve potom vytvoří projektovou podsložku a zapisuje soubory přes File System Access API.

Handle pracovní složky se ukládá do IndexedDB (ne do JSON projektu ani `localStorage`). Po restartu prohlížeče může být potřeba **Znovu povolit přístup**. Oprávnění platí jen pro daný origin — proto spouštějte aplikaci vždy na stejném `127.0.0.1:5173`.

Prohlížeč z bezpečnostních důvodů obvykle nezpřístupní plnou systémovou cestu. TAG Studio zobrazuje název složky a stav oprávnění, ne vymyšlenou cestu `C:\...`.

Pokud API není dostupné (jiný prohlížeč, nesecure kontext, zamítnutý přístup), editor zůstane funkční: jednotlivé soubory se stahují a **Exportovat vše** stáhne ZIP se stejným obsahem. Aplikace v tomto režimu **netvrdí**, že soubory leží v konkrétní složce na disku.

Konflikt existujícího souboru: **Přepsat**, **Uložit jako novou verzi** (`_v02`, `_v03`) nebo **Zrušit**.

## Dithering

Úpravy a vzdálenost k paletě probíhají v **lineárním RGB** (sRGB → linear). Citlivost červené snižuje vzdálenost k červené u pixelů s převažujícím R kanálem. Projekt ukládá **stabilní ID** algoritmu, ne index v nabídce.

| Režim | ID | Doporučení |
| --- | --- | --- |
| Bez ditheringu | `none` | text, loga, plochá grafika |
| Floyd–Steinberg | `floyd-steinberg` | klasická fotografie |
| Atkinson | `atkinson` | čitelnější e-paper, výchozí 2. fáze BWR |
| Sierra Lite | `sierra-lite` | lehčí error diffusion, komiksy |
| Burkes | `burkes` | univerzální obraz / fotografie |
| Bayer 2×2 | `bayer-2x2` | hrubý rastr, plochy |
| Bayer 4×4 | `ordered` | technická grafika; stejné ID jako ve v0.1.0 |
| Bayer 8×8 | `bayer-8x8` | jemnější rastr |
| Blue noise | `blue-noise` | přirozenější zrno bez Bayerovy mřížky |
| BWR dvoufázový | `bwr-two-phase` | komiksy, memy, akcentová červená |

**BWR dvoufázový:** nejprve rezervuje chromatické červené/oranžové akcenty, zbytek ditheruje jen mezi černou a bílou. Neutrální šedá, černá a bílá při výchozím nastavení (ochrana neutrálních tónů zapnuta) nedostanou náhodné červené pixely. Náhled **Výsledek / Červená maska** nemění export.

Stucki a Jarvis–Judice–Ninke v této verzi nejsou. Registr algoritmů je připravený na jejich přidání.

RGB hodnoty odchýlené o 1 od čisté palety (`254/255`) se při importu normalizují. Výstup má vždy přesně `#FFFFFF`, `#000000`, `#FF0000`.

## BWR vzory 01–16

Displej má jen tři fyzické barvy. Šedá, růžová a tmavá červená jsou **pravidelné 1×1 px vzory** z bílé, černé a červené — ne další RGB odstíny a ne alfa.

- ID `bwr-01-white` … `bwr-16-red50` jsou stabilní; projekt ukládá ID, ne matici tile.
- Vzorkování je ukotvené ke globálním souřadnicím plátna `(x, y)`. Posun objektu posune hranici, ne fázi rastru.
- Vzory se kreslí v ostré vrstvě **po** ditheringu rastrového obrázku a **znovu se neditherují**.
- Na velmi malém textu (pod cca 12 px) směs nemusí být čitelná; volba zůstává povolená.
- Čísla 01–16 ve vzorníku jsou jen popisky UI. Do kresby se vkládají jen u šablony **BWR barevný test**.

## Šablony

Galerie se otevře tlačítkem **Nový**. Šablony jsou lokální a offline.

| ID | Název | Poznámka |
| --- | --- | --- |
| `blank` | Prázdná | Čistý projekt |
| `bwr-color-test-01-16` | BWR barevný test 01–16 | 296×152, mřížka 4×4 buněk 74×38 px |
| `image-captions` | Obrázek + horní a dolní titulek | Zástupné pole + ostré titulky |
| `heading-info` | Velký nadpis + informační blok | Informační štítek |
| `product-price` | Produkt / cena | Výrazná cena |
| `three-color-split` | Tříbarevné rozdělení | Černá, červená, vzor 05 |

Pixelová reference 296×152: [`testPIC/small_296x152/BWR_barevny_test_EDG2-0260-A_296x152.png`](testPIC/small_296x152/BWR_barevny_test_EDG2-0260-A_296x152.png). Kanonické tile jsou v `src/core/bwrPatterns.ts` a v [docs/BWR_PATTERNS.md](docs/BWR_PATTERNS.md).

## Profily displejů

| Profil | Na šířku | Na výšku | Plocha | 1 rovina | 2 roviny |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vusion EDG2-0260-A | 296×152 | 152×296 | 60,1×30,7 mm | 5 624 B | 11 248 B |
| Vusion EDG2-0420-B | 400×300 | 300×400 | 84,8×63,6 mm | 15 000 B | 30 000 B |

Vlastní šířka a výška: kladná celá čísla. Binární roviny se packují jako souvislý bitstream. Přepnutí profilu s jiným rozměrem se ptá: přizpůsobit kompozici, změnit plátno bez škálování, nebo zrušit.

## PNG / BIN / C a dvě 1bitové roviny

**PNG:** přesné rozlišení, 8bit RGB bez alphy, jen tři barvy palety.

**BIN:** bajty roviny A, za nimi rovina B (nebo naopak v pokročilém nastavení).

**Výchozí kodek `planeMap: legacy` (ověřen proti referenčnímu `dithered_image.png` + `image_data_array.c`):**

- pixely po řádcích, MSB-first (první pixel řádku = bit 7);
- bílá `A=1 B=1`, černá `A=0 B=1`, červená `A=0 B=0`;
- kombinace `A=1 B=0` se při běžném exportu nevytváří; při dekódování je magenta a počítá se jako neplatná.

**Předvolba `planeMap: cog-edg2-0260-a`** (logické mapování naměřené na CoG EDG2-0260-A; rovina A = příkaz `0x10`, rovina B = `0x13`):

| Barva | PNG RGB | 0x10 | 0x13 |
| --- | --- | ---: | ---: |
| bílá | 255,255,255 | 0 | 0 |
| černá | 0,0,0 | 1 | 0 |
| červená | 255,0,0 | 0 | 1 |

`0x10` a `0x13` jsou identifikátory příkazů CoG, **ne** bajty vkládané do obrazového BIN. Výchozí export zůstává legacy, aby se neporušila kompatibilita v0.1/v0.2. Sestavení BIN podle CoG mapování na fyzickém tagu ještě není OVĚŘENO vykreslením.

**C:** `const unsigned char gImage[] = { ... };` a `const unsigned int gImageSize = sizeof(gImage);` — **nikdy** hardcoded velikost jako v referenčním souboru `gImage[240000]`. Volitelně kvalifikátor SDCC `__code`.

Pokročilé volby: LSB-first, prohození rovin, inverze, otočení 0/90/180/270, flip X/Y, název pole, mapování rovin. Diagnostika zpětně dekóduje BIN a porovná ho s náhledem.

## Projektový soubor

`project.tagstudio.json`, `schemaVersion: 3`. Obsahuje `projectId`, `createdAt`, `modifiedAt`, `folderName`, profil, plátno, `background` (`FillStyle`), vrstvy (obrázky jako data URL; výplně textu a obdélníků jako `solid` nebo `bwr-pattern`), dithering včetně BWR parametrů, okraj a export včetně `planeMap`.

Projekty schema 1 a 2 se otevřou v paměti: staré řetězcové barvy (`"black"`) se převedou na `{ kind: "solid", color: "black" }`, doplní se výchozí pozadí a `planeMap: "legacy"`. Soubor na disku se při pouhém otevření nepřepíše. Schema novější než 3 se odmítne hláškou.

Automatická záloha je v `localStorage` a nabízí obnovení; lze ji vymazat. Podrobnosti schématu: [docs/SCHEMA.md](docs/SCHEMA.md).

## Testovací fixture

| Soubor | Účel |
| --- | --- |
| `dithered_image.png` + `image_data_array.c` | regresní kodek v0.1 (legacy) |
| `projekt.tagstudio.json` | schema 1, migrace |
| `testPIC/small_296x152/takemoney.jpg` | e2e import obrázku |
| `testPIC/small_296x152/BWR_barevny_test_EDG2-0260-A_296x152.png` | obrazová reference vzorníku 01–16 |

## Známá omezení 0.3.0

- žádné rádio, flash ani odesílání na CC2510;
- žádný mobilní editor, animace ani analogové RGB odstíny;
- žádný Windows EXE / Tauri;
- File System Access jen v Chromiu s uživatelským gestem a secure kontextem;
- libovolný úhel rotace obrázku je v panelech; na plátně jsou tažení, 4 rohové úchytky a konce čáry;
- text se rasterizuje maskou + prahem 128, proto velmi tenké glyfy mohou zmizet;
- vzorovaná výplň na malém textu vizuálně splyne;
- CoG BIN předvolba je logicky otestovaná, na fyzickém tagu zatím ne;
- undo ukládá snímky projektu (včetně data URL), historie je omezená.

Font Inter je přibalen přes `@fontsource/inter` (SIL Open Font License 1.1), včetně latin-ext. ZIP fallback používá `fflate` (MIT). Blue-noise dlaždice je vlastní deterministický void-and-cluster, bez cizího assetu.
