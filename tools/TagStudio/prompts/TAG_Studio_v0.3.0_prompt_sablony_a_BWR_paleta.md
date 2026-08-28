# Hotový prompt – TAG Studio v0.3.0

Pracuj autonomně na existujícím projektu **TAG Studio v0.2.0**. Implementuj verzi **0.3.0**, jejímž hlavním cílem je doplnit hardwarově ověřenou BWR paletu pixelových vzorů a systém vestavěných grafických šablon. Neskonči pouze návrhem: prozkoumej skutečný stav projektu, implementuj funkce, doplň testy a dokumentaci a ověř sestavení aplikace.

## 1. Výsledek a definice hotového stavu

TAG Studio 0.3.0 musí uživateli umožnit:

1. otevřít vestavěnou šablonu **BWR barevný test 01–16** pro profil EDG2-0260-A (296 × 152 px);
2. vybírat 16 hardwarově ověřených BWR výplní jako solidní barvu nebo přesný pixelový vzor;
3. používat tyto výplně minimálně pro pozadí plátna a vyplněné vektorové objekty, které současný editor podporuje; pokud současná architektura dovoluje vzorovanou výplň textu bez regresí, podporuj ji také;
4. založit nový projekt z jednoduchých vestavěných grafických šablon;
5. uložit projekt a znovu jej otevřít bez změny zvolených vzorů;
6. exportovat PNG, BIN a C ze stejného výsledného bitmapu jako náhled;
7. zachovat funkce, formáty a referenční kompatibilitu v0.1.0 a v0.2.0.

V uživatelském rozhraní i v `package.json` musí být verze `0.3.0`.

## 2. Zdroje pravdy a priority

Postupuj podle tohoto pořadí:

1. projektové instrukce a skutečný stav repozitáře;
2. tato specifikace;
3. přiložený soubor `BWR_barevny_test_EDG2-0260-A_296x152.png` jako přesná obrazová reference;
4. přiložená fotografie `palete.jpeg` jako doklad vzhledu na fyzickém displeji, nikoli jako pixelová fixture kvůli perspektivě a kompresi;
5. existující implementace, testy a referenční fixture v TAG Studiu;
6. README a CHANGELOG.

Před změnami ověř hranici repozitáře, pracovní větev a stav pracovního stromu. Zachovej nesouvisející uživatelské změny. Nejprve projdi datový model, renderovací pipeline, kodek, migraci projektu, správu projektových složek a současné komponenty textů a tvarů. Nevymýšlej cesty ani API, která v projektu nejsou.

## 3. Zásadní pravidlo BWR vzorů

Displej fyzicky používá pouze tři barvy:

- bílá: `RGB(255,255,255)`;
- černá: `RGB(0,0,0)`;
- červená: `RGB(255,0,0)`.

Vizuální šedá, růžová a tmavá červená nejsou další RGB barvy. Jsou to pravidelné **1×1px ditheringové vzory** složené výhradně z bílé, černé a červené.

Vzory nesmí:

- používat alfa průhlednost nebo mezilehlé RGB hodnoty ve výsledném bitmapu;
- být bilineárně škálovány, rozmazány ani antialiasovány;
- být po složení znovu zpracovány obecným ditheringem;
- měnit fázi při posunu nebo změně velikosti objektu.

Všechny pixelové vzory ukotvi ke globálním souřadnicím plátna: barva pixelu je funkcí `canvasX` a `canvasY`, nikoli lokálního počátku objektu. Posunutí objektu tedy posune jeho hranici, ale nerozhodí rastr vůči ostatním objektům.

Výplně aplikuj ve fázi ostrých textů/tvarů po zpracování a ditheringu rastrového obrázku, před finální normalizací palety. Náhled i všechny exporty musí používat tentýž výsledný bitmap.

## 4. Stabilní registr vzorů

Vytvoř typovaný registr podobný `ditherRegistry.ts`. Každá položka musí mít alespoň:

- stabilní `id`;
- číslo `01–16`;
- český název;
- stručný popis;
- poměr W/B/R;
- periodickou matici/tile složenou ze symbolů W, B, R;
- kategorii `solid`, `white-black`, `white-red`, `black-red` nebo `three-color`.

Použij stabilní ID například `bwr-01-white` až `bwr-16-red50`. ID nesmí být odvozené pouze z českého názvu a nesmí se měnit při budoucím přejmenování popisku.

Kanonické symboly:

- `.` = bílá;
- `#` = černá;
- `@` = červená.

Kanonické vzory:

| # | Opakovaný tile | Poměr W / B / R | Český význam |
|---:|---|---:|---|
| 01 | solid `.` | 100 / 0 / 0 | Plná bílá |
| 02 | solid `#` | 0 / 100 / 0 | Plná černá |
| 03 | solid `@` | 0 / 0 / 100 | Plná červená |
| 04 | `..` / `#.` | 75 / 25 / 0 | Světle šedá |
| 05 | `.#` / `#.` | 50 / 50 / 0 | Střední šedá |
| 06 | `.#` / `##` | 25 / 75 / 0 | Tmavě šedá |
| 07 | `..` / `.@` | 75 / 0 / 25 | Světle růžová |
| 08 | `@.` / `.@` | 50 / 0 / 50 | Střední červená |
| 09 | `@@` / `@.` | 25 / 0 / 75 | Sytá červená |
| 10 | `##` / `@#` | 0 / 75 / 25 | Tmavá červená |
| 11 | `@#` / `#@` | 0 / 50 / 50 | Červená a černá 50/50 |
| 12 | `@@` / `#@` | 0 / 25 / 75 | Červená s černým rastrem |
| 13 | `#@.` / `@.#` / `.#@` | 33⅓ / 33⅓ / 33⅓ | Tříbarevná diagonála |
| 14 | `..` / `#@` | 50 / 25 / 25 | Bílá 50 %, černá 25 %, červená 25 % |
| 15 | `##` / `@.` | 25 / 50 / 25 | Černá 50 %, bílá 25 %, červená 25 % |
| 16 | `@@` / `.#` | 25 / 25 / 50 | Červená 50 %, bílá 25 %, černá 25 % |

Lomítko v tabulce odděluje řádky periodického tile. Před implementací porovnej fázi a orientaci vzorů s referenčním PNG. Pokud reference jednoznačně ukáže jinou fázi téhož poměru, zachovej vizuální orientaci reference a zaznamenej to v testu; neměň však poměr ani použité fyzické barvy.

## 5. Uživatelské rozhraní palety

Do ovládání výplně přidej přehlednou paletu:

- nahoře tři solidní barvy 01–03;
- pod nimi skupiny 04–06, 07–09, 10–12 a 13–16;
- každá položka má skutečný náhled pixelového vzoru a viditelné číslo;
- tooltip nebo detail zobrazí název, poměr W/B/R a stručný popis;
- aktivní vzor je zřetelně označený;
- volba musí být použitelná myší i klávesnicí a mít smysluplný přístupný název;
- nabídni přepínač mezi stávajícími solidními barvami a `BWR vzory`, pokud je to pro současné UI přehlednější než jedna dlouhá paleta.

Číslo je pouze identifikátor v UI a ve vzorníku. Při použití vzoru jako výplně se do kresby číslo ani rámeček nevkládají.

Pokud je vzor použit na velmi malý text nebo objekt, může UI nenásilně upozornit, že směs nebude na několika pixelech vizuálně stabilní. Nezakazuj však uživateli volbu.

## 6. Vestavěná šablona BWR test 01–16

Přidej vestavěnou šablonu **BWR barevný test 01–16**:

- cílový profil: EDG2-0260-A;
- rozměr přesně 296 × 152 px, landscape;
- mřížka 4 × 4;
- každá logická buňka má 74 × 38 px;
- pořadí zleva doprava a shora dolů: 01–04, 05–08, 09–12, 13–16;
- každé pole používá příslušný kanonický vzor;
- číslo je ostré, čitelné a umístěné v malém kontrastním rámečku;
- celý výsledný obraz používá pouze tři povolené RGB hodnoty;
- žádný okraj nesmí zvětšit plátno nad 296 × 152 px.

Šablonu pokud možno skládej z dat registru, nikoli z jednoho neprůhledného bitmapového souboru. Referenční PNG použij jako fixture pro pixelovou nebo strukturální kontrolu. Jestli čísla a rámečky v referenci brání přímému pixelovému porovnání, testuj zvlášť přesnou geometrii, pořadí, tile každého pole a povolenou paletu.

V UI zobraz šablonu v kategorii `Testovací` a přidej popis: „Hardwarový vzorník bílé, černé, červené a jejich optických směsí.“

## 7. Systém grafických šablon

Přidej jednoduchou galerii **Šablony**, dostupnou při vytváření nového projektu. Nezaváděj cloud ani backend. Vestavěné šablony jsou lokální, deterministické a fungují offline.

Minimální sada:

1. **Prázdná** – současný nový projekt;
2. **BWR barevný test 01–16** – výše definovaný hardwarový vzorník;
3. **Obrázek + horní a dolní titulek** – vhodné například pro meme, text zůstává ostrý;
4. **Velký nadpis + informační blok** – univerzální informační štítek;
5. **Produkt / cena** – výrazná hodnota, název a menší doplňkový text;
6. **Tříbarevné rozdělení** – jednoduchá kompozice demonstrující černou, červenou a jeden vybraný vzor.

Obecné šablony navrhni parametricky podle rozměrů aktuálního profilu a s bezpečným okrajem 4–6 px. Nevkládej cizí obrázky, loga ani fonty s problematickou licencí. Použij existující objekty editoru a zástupné texty, které uživatel snadno přepíše.

Každá šablona má mít stabilní ID, český název, kategorii, náhled, podporované profily a funkci, která vytvoří běžná projektová data. Projekt musí po vytvoření fungovat samostatně; nesmí být trvale závislý na budoucí existenci definice šablony.

Při založení ze šablony:

- vytvoř nový `projectId`, místní čas a složku `TAG_Project_YYYY-MM-DD_HH-mm-ss` stejnou cestou jako současné tlačítko **Nový**;
- nepřepisuj aktivní projekt bez potvrzení, pokud obsahuje neuložené změny;
- zachovej File System Access API i download/ZIP fallback z v0.2.0;
- neměň pravidla konfliktu `Přepsat / _v02 / Zrušit` bez důvodu.

## 8. Projektový model a migrace

Protože se do projektu ukládají nové druhy výplní, zvyš schema projektu na **3**.

Model výplně navrhni explicitně, například jako diskriminovanou unii:

```ts
type FillStyle =
  | { kind: 'solid'; color: PaletteColor }
  | { kind: 'bwr-pattern'; patternId: BwrPatternId };
```

Přizpůsob typ skutečné architektuře projektu, ale neukládej celý tile opakovaně do každého objektu. Ukládej stabilní ID a řeš neznámé ID bezpečnou validační chybou nebo definovaným fallbackem s upozorněním.

Migrace:

- schema 1 → 2 musí zůstat funkční;
- schema 2 → 3 převede dosavadní barvy na `solid` výplně a doplní potřebné výchozí hodnoty;
- otevření staršího projektu proběhne v paměti a samotným otevřením se soubor nepřepíše;
- schema > 3 se odmítne s jasnou chybou;
- uložení migrovaného projektu zapíše schema 3.

Pokud současný model neumí pozadí nebo výplň textu reprezentovat jednotně, proveď nejmenší čisté rozšíření bez zbytečného přepisování celé architektury.

## 9. Hardwarové mapování CoG

Na skutečném CoG bylo zjištěno následující logické mapování:

| Barva | RGB v PNG | rovina `0x10` | rovina `0x13` |
|---|---|---:|---:|
| bílá | 255,255,255 | 0 | 0 |
| černá | 0,0,0 | 1 | 0 |
| červená | 255,0,0 | 0 | 1 |

Toto mapování zdokumentuj a pokryj jednotkovým testem logického převodu barvy na dvojici bitů. Nejprve ověř, jak souvisí s existujícím A/B kodekem, inverzemi, pořadím rovin a referenčními fixture.

**Neměň potichu stávající výchozí BIN/C kodek**, pokud by to porušilo kompatibilitu v0.1.0 nebo současné fixture. Jestli stávající pokročilé volby už umějí stejné mapování vyjádřit, přidej pojmenovanou hardwarovou předvolbu pro EDG2-0260-A a ponech legacy chování dostupné. Pokud vztah k formátu BIN nelze ze zdrojů bezpečně určit, implementuj pouze ověřenou logickou mapovací funkci, diagnostiku a dokumentaci a ve finálním reportu jasně popiš, co ještě vyžaduje fyzický test.

Hodnoty `0x10` a `0x13` jsou identifikátory/command kontext rovin CoG, nikoli automaticky bajty, které se mají vložit do obrazových dat. Nevkládej je do BIN bez důkazu ze stávajícího firmwaru nebo specifikace.

## 10. Renderování a export

Zachovej jedinou renderovací pipeline. Po finálním složení ověř, že každý pixel je přesně jedna z hodnot:

- `#FFFFFF`;
- `#000000`;
- `#FF0000`.

Náhled, statistiky palety, PNG, BIN a C musí vycházet ze stejného bitmapu. Statistika B/Č/R musí správně počítat skutečné pixely použitých vzorů.

Při exportu vzorů:

- zachovej periodu 1–3 px přesně;
- nepoužívej CSS transformaci nebo náhled canvasu jako zdroj exportních dat;
- při zoomu může UI škálovat náhled pouze způsobem `pixelated`/nearest-neighbor, export zůstává 1:1;
- opakovaný export stejného projektu se stejnými daty musí být byte-for-byte deterministický.

## 11. Testy

Doplň přiměřené unit, integrační a e2e testy. Minimálně ověř:

1. registr obsahuje přesně stabilní položky 01–16;
2. každý tile obsahuje pouze W/B/R a má deklarovaný poměr;
3. vzory 04–16 mají očekávanou periodu, fázi a orientaci;
4. globální ukotvení rastru: dva překrývající nebo sousedící objekty používají shodnou fázi plátna;
5. výsledný bitmap nikdy neobsahuje čtvrtou barvu;
6. testovací šablona má přesně 296 × 152 px, 4 × 4 buněk a správné pořadí 01–16;
7. čísla a rámečky jsou součástí bitmapu a jsou čitelné bez antialias barev;
8. náhled a PNG/BIN/C vycházejí ze stejného bitmapu;
9. stejné vstupy dávají identické bajty;
10. projekt schema 2 se otevře a migruje na schema 3 v paměti;
11. projekt se vzorem se uloží a po znovuotevření vyrenderuje identicky;
12. schema > 3 se odmítne;
13. stávající codec fixture a testy v0.1/v0.2 zůstanou beze změny, pokud vědomě nepřidáš samostatnou předvolbu;
14. logické mapování W/B/R na roviny CoG odpovídá tabulce výše;
15. e2e: otevření galerie, založení ze šablony, změna vzoru, uložení projektu a `Exportovat vše`;
16. e2e pro File System Access API mock i fallback download/ZIP podle současného testovacího vzoru projektu.

Testy nepiš tak, aby pouze kopírovaly tutéž chybnou implementaci. Pro kanonické tile používej explicitní očekávané matice a pro referenční výstup samostatnou fixture nebo hash.

## 12. Dokumentace

Aktualizuj:

- `README.md`: práce se šablonami, význam BWR vzorů, jak zabránit opětovnému ditheringu a omezení malých vzorovaných textů;
- `CHANGELOG.md`: verze 0.3.0;
- případnou dokumentaci projektového JSON schema 3;
- popis hardwarově zjištěného mapování rovin a rozdíl mezi logickou barvou, pixelovým vzorem a fyzickými rovinami.

Uveď credit **HanzG** stejně jako v předchozích verzích.

## 13. Mimo rozsah

Do této verze nepřidávej:

- rádio, flashování nebo odesílání do CC2510;
- backend, cloud nebo povinné internetové služby;
- Tauri/EXE nebo mobilní aplikaci;
- Stucki/Jarvis/JJN dithering;
- animace, gradienty nebo analogové RGB odstíny;
- rozsáhlý redesign nesouvisející se šablonami a paletou;
- commit, push, release nebo deployment bez výslovného požadavku uživatele.

## 14. Povinné ověření

Spusť skutečné projektové příkazy odpovídající minimálně:

- TypeScript typecheck;
- ESLint;
- Vitest;
- produkční Vite build;
- Playwright e2e v Chromium.

Použij názvy skriptů, které skutečně existují v `package.json`. Pokud některý příkaz není dostupný, nevymýšlej výsledek: vysvětli důvod a spusť nejbližší relevantní kontrolu. Všechny regrese způsobené touto změnou oprav.

Navíc ručně nebo automatizovaně ověř:

- rozměr testovacího PNG 296 × 152;
- unikátní barvy výsledku jsou přesně podmnožina `{#FFFFFF, #000000, #FF0000}`;
- BIN pro dvě souvislé jednobitové roviny při 296 × 152 má v legacy formátu očekávanou velikost podle skutečného kodeku; pokud současný formát odpovídá dvěma čistým rovinám bez hlavičky, očekává se 11 248 bajtů;
- žádný vzor není po exportu rozmazaný nebo převedený na mezilehlé barvy.

## 15. Průběžná práce a závěrečné předání

Postupuj po logických fázích a stručně oznamuj dokončené části, zjištěné odchylky a skutečné blockery. Na běžná implementační rozhodnutí se neptej; zvol nejmenší řešení kompatibilní s existující architekturou.

Neskonči plánem. Skonči až po implementaci a ověření, nebo dolož blocker, který nelze bezpečně obejít.

V závěru uveď:

1. co bylo implementováno;
2. hlavní nové a změněné soubory;
3. podobu registru a projektového schema 3;
4. skutečně spuštěné příkazy a jejich výsledky;
5. výsledek kontroly rozměru, palety a determinismu;
6. stav kompatibility kodeku v0.1/v0.2;
7. co bylo a nebylo ověřeno na fyzickém tagu;
8. známá omezení a doporučený jediný následující krok.

Commit nevytvářej, pokud k tomu uživatel nedá samostatný pokyn.
