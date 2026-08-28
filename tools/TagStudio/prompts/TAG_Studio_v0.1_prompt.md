# TAG Studio v0.1 – podklady a vývojový prompt

## Podklady k úkolu

### Cíl

Vytvořit jednoduchý lokální editor grafiky pro tříbarevné elektronické cenovky Vusion. Editor poběží v prohlížeči, nebude potřebovat backend ani internet a všechny obrázky bude zpracovávat výhradně v počítači uživatele.

První verze má odstranit potřebu připravovat obrázek v několika programech a následně jej nahrávat do cizího online převodníku. Uživatel má v jedné aplikaci vybrat tag, vložit a upravit obrázek, převést jej na bílou/černou/červenou, přidat ostré texty a tvary a vyexportovat PNG i data pro firmware.

### Podporované displeje

| Profil | Rozlišení | Aktivní plocha | Poměr stran | Bity jedné roviny | Dvě roviny celkem |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vusion EDG2-0260-A | 296 × 152 px | 60,1 × 30,7 mm | přibližně 1,947 : 1 | 5 624 B | 11 248 B |
| Vusion EDG2-0420-B | 400 × 300 px | 84,8 × 63,6 mm | 4 : 3 | 15 000 B | 30 000 B |

Oba profily používají paletu:

- bílá `#FFFFFF`;
- černá `#000000`;
- červená `#FF0000`.

### Ověřený referenční výstup online převodníku

K zadání jsou určeny dva referenční soubory:

- `dithered_image.png` – výsledný obraz 296 × 152 px;
- `image_data_array.c` – odpovídající C data.

Analýzou bylo ověřeno:

- PNG má 44 992 pixelů a efektivně používá jen bílou, černou a červenou. Několik hodnot se od čistých barev liší pouze o 1 (`254/255`) a při importu se proto musí normalizovat na přesnou paletu;
- C soubor obsahuje přesně 11 248 inicializovaných bajtů;
- data tvoří dvě po sobě jdoucí jednobitové roviny po 5 624 bajtech;
- pixely jsou uvnitř bajtu řazeny MSB-first a obraz je řádkově zleva doprava, shora dolů;
- výchozí kombinace bitů referenčního souboru je:

| Barva pixelu | Rovina A | Rovina B |
| --- | ---: | ---: |
| bílá | 1 | 1 |
| černá | 0 | 1 |
| červená | 0 | 0 |

Kombinace `A=1, B=0` se ve tříbarevném obrazu nepoužívá.

V referenčním C souboru je chyba: deklaruje `gImage[240000]`, přestože obsahuje jen 11 248 bajtů. Nový editor tuto chybu nesmí opakovat. Má použít skutečnou velikost nebo pole bez explicitní velikosti, například `const unsigned char gImage[]`.

Formát ještě nebyl ověřen fyzickým vykreslením na tagu. Editor proto musí mít pokročilé transformační volby (pořadí bitů, prohození a inverze rovin, otočení a převrácení), ale běžný uživatel je nemá vidět při standardní práci.

---

## Hotový prompt

```text
Vytvoř samostatnou lokální webovou aplikaci „TAG Studio“ ve verzi 0.1.0. Jejím účelem je připravovat pixelově přesnou tříbarevnou grafiku pro elektronické cenovky Vusion. Aplikaci kompletně implementuj, otestuj a zdokumentuj. Nezůstávej pouze u návrhu, mockupu nebo technické analýzy.

## 1. Požadovaný výsledek

Hotová aplikace musí v jednom pracovním postupu umožnit:

1. vybrat profil cílového Vusion tagu;
2. nahrát rastrový obrázek;
3. interaktivně jej posunout, změnit jeho velikost, oříznout, otočit nebo převrátit;
4. převést obraz do přesné palety bílá/černá/červená pomocí několika režimů ditheringu;
5. přidat nad převedený obraz ostré texty a jednoduché tvary pouze ve třech podporovaných barvách;
6. zobrazit věrný pixelový náhled;
7. exportovat přesný PNG, binární data dvou 1bitových rovin a korektní C pole pro firmware;
8. uložit rozpracovaný projekt a později jej znovu otevřít.

Aplikace musí běžet lokálně v aktuálním Chrome nebo Edge. Nesmí nahrávat obrázky, projekty ani jiné údaje na internet. Pro základní funkce nesmí potřebovat backend, účet, cloudovou službu ani API klíč.

## 2. Nejprve ověř pracovní prostředí

- Přečti všechny projektové instrukce a relevantní soubory v repozitáři.
- Ověř, zda jde o nový projekt, nebo existující kód. Zachovej všechny nesouvisející změny uživatele.
- Pokud jsou přiloženy `dithered_image.png` a `image_data_array.c`, použij je jako referenční testovací fixture. Nevěř slepě deklarované velikosti C pole; skutečný počet inicializovaných bajtů je zdroj pravdy.
- Pokud některé rozhodnutí není kritické, zvol rozumnou technickou variantu, stručně ji zdokumentuj a pokračuj. Zastav se pouze při skutečném blockeru, ztrátě dat nebo zásadním rozšíření rozsahu.

## 3. Doporučený technický základ

Použij moderní, udržovatelný frontend:

- React + TypeScript v přísném režimu;
- Vite;
- Canvas 2D pro vlastní pixelové zpracování a offscreen render;
- pro interaktivní transformace vrstev můžeš použít zralou canvasovou knihovnu, například Konva/react-konva, pokud tím zjednodušíš implementaci; výsledný export však musí být řízen naším vlastním deterministickým renderovacím a kódovacím modulem;
- Vitest pro jednotkové testy;
- Playwright nebo ekvivalent pro několik nejdůležitějších uživatelských průchodů;
- ESLint a vhodné formátování.

Nepoužívej CDN závislosti. Aplikace musí fungovat po lokálním sestavení i bez internetu. Odděl datový model projektu, renderování, dithering, exportní kodek a UI tak, aby šly algoritmy testovat bez prohlížečového rozhraní.

Pokud v existujícím projektu již je srovnatelný a vhodný stack, respektuj jej. Nepřepisuj funkční základ bez důvodu.

## 4. Profily displejů

Zabuduj nejméně tyto profily:

### Vusion EDG2-0260-A

- rozlišení na šířku: 296 × 152 px;
- rozlišení na výšku: 152 × 296 px;
- aktivní plocha: 60,1 × 30,7 mm;
- paleta: `#FFFFFF`, `#000000`, `#FF0000`;
- jedna 1bitová rovina: 5 624 B;
- dvě roviny: 11 248 B.

### Vusion EDG2-0420-B

- rozlišení na šířku: 400 × 300 px;
- rozlišení na výšku: 300 × 400 px;
- aktivní plocha: 84,8 × 63,6 mm;
- paleta: `#FFFFFF`, `#000000`, `#FF0000`;
- jedna 1bitová rovina: 15 000 B;
- dvě roviny: 30 000 B.

Umožni také vlastní šířku a výšku, ale validuj kladná celá čísla. Pro binární export vyžaduj šířku dělitelnou osmi, nebo jednoznačně implementuj a zdokumentuj výplň posledního bajtu každého řádku. Vestavěné profily žádnou výplň nepotřebují.

Přepnutí profilu nesmí tiše zničit projekt. Nabídni potvrzenou volbu mezi přizpůsobením stávající kompozice, změnou plátna bez škálování a zrušením operace.

## 5. Uživatelské rozhraní

Navrhni kompaktní desktopové UI v češtině. Výchozí rozvržení:

- horní lišta: nový projekt, otevřít, uložit, zpět, znovu, profil tagu, orientace a export;
- levý panel: přidání obrázku, textu, obdélníku a čáry; seznam vrstev;
- střed: pracovní plátno s možností přiblížení a posunu;
- pravý panel: vlastnosti vybrané vrstvy a nastavení převodu;
- stavový řádek: rozlišení, souřadnice, zoom, počet použitých barev a očekávaná velikost exportu.

Požadavky na použitelnost:

- funguje bez horizontálního scrollování při 1366 × 768;
- centrální plátno využívá zbývající prostor;
- zoom nemění výsledné pixely exportu;
- při velkém zoomu použij `image-rendering: pixelated` a volitelnou pixelovou mřížku;
- zobraz přepínatelný bezpečný okraj, výchozí 6 px; okraj je pouze vodítko a neexportuje se;
- podporuj výběr, přesun, změnu velikosti, otočení, pořadí, skrytí, uzamčení, duplikování a odstranění vrstvy;
- podporuj klávesy Delete, Ctrl+Z, Ctrl+Y/Ctrl+Shift+Z, Ctrl+S, Ctrl+O a šipky pro jemný posun;
- destruktivní operace potvrď, pokud by vedly ke ztrátě neuložené práce;
- nepoužívej přehnaně velké karty, nadbytečné mezery ani dekorace, které ubírají pracovní plochu;
- zobraz verzi `0.1.0` a nenápadný credit `HanzG`.

## 6. Obrázkové vrstvy a dithering

Podporuj alespoň PNG, JPEG a WebP. Přetažení souboru musí fungovat stejně jako tlačítko pro výběr souboru. Průhlednost kompozituj na bílém pozadí.

U obrázkové vrstvy nabídni:

- posun a rozměry;
- zachování poměru stran;
- režimy contain, cover a ruční výřez;
- otočení o libovolný úhel a rychlé kroky 90°;
- převrácení vodorovně a svisle;
- jas, kontrast a sytost;
- citlivost/práh červené;
- zapnutí a vypnutí ditheringu.

Implementuj deterministicky minimálně:

1. bez ditheringu – přiřazení nejbližší barvy palety;
2. Floyd–Steinberg, ideálně se serpentinovým průchodem;
3. Atkinson;
4. ordered dithering s Bayerovou maticí alespoň 4 × 4.

Výpočet barev prováděj konzistentně; preferuj lineární RGB nebo jinou rozumně perceptuální metriku. Dokumentuj použitý postup. Výstup každého algoritmu musí obsahovat pouze tři přesné barvy palety a být při stejném vstupu deterministický.

Náhled přepočítávej průběžně, ale změny ovladačů debounce/throttle tak, aby UI zůstalo plynulé. Pro rozlišení 400 × 300 nesmí být běžná úprava pocitově blokující. Pokud je potřeba, použij Web Worker.

## 7. Textové a tvarové vrstvy

Text a tvary renderuj až po ditheringu obrázkového podkladu. Jejich výsledek musí být ostrý a tvořený pouze čistou bílou, černou nebo červenou, bez poloprůhledných a mezilehlých RGB pixelů.

U textu podporuj:

- obsah včetně české diakritiky;
- barvu bílá/černá/červená;
- velikost v pixelech;
- normální a tučný řez;
- zarovnání vlevo, na střed a vpravo;
- více řádků a řádkování;
- volitelnou jednobarevnou obrysovou konturu pro čitelnost.

Zajisti stabilní render písma. Pokud je to licenčně možné, přibal alespoň jeden lokální OFL font s českou diakritikou v normálním a tučném řezu. Neodkazuj font z internetu. Hrany glyfů vykresli přes masku a prahování nebo jiným způsobem, který po exportu nezanechá antialiasované odstíny.

Tvary v0.1:

- obdélník s volitelnou výplní a obrysem;
- přímka s volitelnou tloušťkou;
- barvy omezené na paletu displeje.

## 8. Renderovací pipeline

Implementuj jasně oddělené fáze:

1. načtení a transformace rastrových vrstev;
2. složení rastrového podkladu v cílovém rozlišení;
3. úpravy obrazu a převod/dithering do tříbarevné palety;
4. vykreslení ostrých textových a tvarových vrstev;
5. konečná normalizace všech pixelů na přesně tři povolené RGB hodnoty;
6. export PNG nebo zakódování do dvou 1bitových rovin;
7. zpětné dekódování exportovaných rovin a interní pixelové porovnání pro kontrolu správnosti.

Pracovní náhled a export musí používat stejný zdroj pravdy. Nevytvářej dvě nezávislé implementace, které se mohou vizuálně rozcházet.

## 9. Formát dvou 1bitových rovin

Výchozí referenční kodek:

- pixely po řádcích zleva doprava, řádky shora dolů;
- MSB-first: první pixel řádku je bit 7 prvního bajtu;
- nejprve celá rovina A, potom celá rovina B;
- mapování:
  - bílá: A=1, B=1;
  - černá: A=0, B=1;
  - červená: A=0, B=0;
- kombinaci A=1, B=0 při dekódování označ jako neplatnou a vizuálně ji diagnostikuj; nevytvářej ji při běžném exportu.

V rozbalené sekci „Pokročilé nastavení exportu“ přidej:

- MSB-first / LSB-first;
- rovina A první / rovina B první;
- inverze roviny A;
- inverze roviny B;
- otočení výsledku 0°, 90°, 180°, 270°;
- převrácení X/Y;
- změnu názvu C pole, výchozí `gImage`.

Nastavení profilu a exportu zahrň do souboru projektu.

## 10. Exporty

### PNG

- přesné rozlišení zvoleného profilu;
- bez alpha kanálu;
- pouze `#FFFFFF`, `#000000`, `#FF0000`;
- žádné hodnoty typu `#FEFFFF` nebo `#FF0100`;
- metadata ani DPI nesmí změnit pixelové rozměry.

### BIN

- čisté bajty roviny A následované rovinou B podle právě zvolených pokročilých transformací;
- pro 296 × 152 ve výchozím režimu přesně 11 248 B;
- pro 400 × 300 ve výchozím režimu přesně 30 000 B.

### C

Generuj čitelný C soubor s komentářem obsahujícím profil, šířku, výšku, velikost jedné roviny, celkovou velikost, mapování barev, pořadí bitů a použité transformace.

Výchozí deklarace:

`const unsigned char gImage[] = { ... };`

Na konec přidej bezpečně odvoditelnou velikost, například:

`const unsigned int gImageSize = sizeof(gImage);`

Nevytvářej deklaraci s chybnou nebo hardcoded velikostí. Hodnoty formátuj po přiměřeném počtu bajtů na řádek. Volitelně dovol variantu kvalifikátoru pro SDCC/CC2510, ale nepředpokládej ji bez popisu.

### Diagnostický export

Umožni zobrazit nebo stáhnout zpětně dekódovaný náhled z právě vytvořených binárních rovin. Tím musí být možné ověřit, že PNG a datový export reprezentují stejný obraz.

## 11. Projektový soubor a historie

Definuj verzovaný JSON formát, například `*.tagstudio.json`, který uchová:

- `schemaVersion`;
- profil a orientaci;
- rozměry plátna;
- všechny vrstvy, jejich pořadí, viditelnost, zámek a transformace;
- původní obrázky, aby byl projekt přenositelný, například jako data URL nebo jiný jasně zdokumentovaný lokální formát;
- nastavení ditheringu;
- bezpečný okraj;
- pokročilé nastavení exportu.

Implementuj otevření a uložení tohoto souboru. Chybné nebo novější schéma zobraz jako srozumitelnou chybu a nepoškoď aktuální práci. Přidej rozumně omezené undo/redo. Můžeš doplnit lokální automatickou obnovu posledního projektu, ale uživatel musí mít možnost ji vymazat a aplikace nesmí bez upozornění nahradit novější ruční projekt.

## 12. Testy a objektivní akceptační kritéria

Přidej automatické testy alespoň pro:

- správné rozměry vestavěných profilů;
- výpočet velikosti jedné a dvou rovin;
- zabalení osmi známých pixelů do bajtu pro MSB-first i LSB-first;
- výchozí mapování bílé, černé a červené do rovin A/B;
- inverzi, prohození rovin, otočení a převrácení;
- encode → decode round-trip bez změny pixelů pro všechny tři barvy;
- přesnou velikost 11 248 B pro 296 × 152;
- přesnou velikost 30 000 B pro 400 × 300;
- skutečný počet bajtů C inicializátoru odpovídající BIN exportu;
- PNG obsahující právě a pouze povolené barvy a správné rozměry;
- deterministický výsledek všech ditheringových algoritmů;
- serializaci a opětovné načtení projektu bez ztráty podporovaných vlastností;
- referenční fixture z `dithered_image.png` a `image_data_array.c`, pokud jsou dostupné: po normalizaci téměř čistých RGB hodnot musí dekódování obou rovin pixelově odpovídat referenčnímu obrazu.

Zásadní UI průchody:

1. zvolit malý tag → nahrát obrázek → upravit výřez → zvolit dithering → přidat text → exportovat PNG/BIN/C;
2. uložit projekt → znovu jej otevřít → získat stejný výsledný render;
3. přepnout na velký tag s potvrzenou strategií změny plátna;
4. použít pokročilou transformaci exportu a ověřit ji zpětným náhledem.

Před dokončením spusť a oprav:

- jednotkové testy;
- integrační/UI testy;
- TypeScript typecheck;
- lint;
- produkční build.

Nevydávej pouze tvrzení, že testy procházejí; do závěrečného předání napiš přesné spuštěné příkazy a jejich výsledky. Pokud něco nelze spustit, uveď konkrétní důvod a dopad.

## 13. Dokumentace a spuštění

Přidej český `README.md` obsahující:

- účel aplikace;
- instalaci závislostí;
- spuštění vývoje;
- produkční build a lokální spuštění buildu;
- základní pracovní postup;
- vysvětlení ditheringu;
- popis profilů displejů;
- popis PNG/BIN/C exportu a dvou rovin;
- upozornění, že skutečné pořadí a polarita rovin se ještě musí potvrdit na fyzickém tagu;
- známá omezení verze 0.1.0.

Přidej Windows pomocný skript pro snadné lokální spuštění, pokud jej lze vytvořit bezpečně a bez globální instalace dalších nástrojů. Skript musí při chybě srozumitelně oznámit chybějící předpoklad. Nevytvářej zatím Tauri/Electron instalátor; to je případná další verze.

Přidej `CHANGELOG.md` s verzí 0.1.0.

## 14. Mimo rozsah v0.1.0

Do této verze nepatří:

- rádiová komunikace s tagem;
- flashování firmwaru;
- přímé odesílání obrazu do CC2510;
- backend, účty, cloudové ukládání nebo telemetrie;
- mobilní editor;
- animace;
- vícebarevné e-paper profily mimo bílou/černou/červenou;
- zabalení do plnohodnotného Windows EXE.

Navrhni kód tak, aby šlo přímé odeslání do tagu a další profily doplnit později, ale nyní je neimplementuj.

## 15. Pracovní postup a závěrečné předání

Pracuj po ověřitelných fázích: základ projektu a datový model, renderovací pipeline, kodek, editor vrstev, exporty, ukládání projektů, testy a dokumentace. Po každé významné fázi spusť relevantní kontroly. Neodstraňuj ani nepřepisuj nesouvisející soubory a neprováděj deployment ani jiné externí zápisy.

Úkol je hotový pouze tehdy, když:

- lze aplikaci skutečně spustit v prohlížeči;
- oba vestavěné profily fungují;
- obrázek lze interaktivně upravit a převést;
- texty a tvary zůstanou tříbarevné a ostré;
- PNG, BIN a C export splňují přesné rozměry a velikosti;
- round-trip dekódování exportu souhlasí s náhledem;
- projekt lze uložit a znovu otevřít;
- všechny dostupné testy, typecheck, lint a build procházejí;
- README umožní jinému člověku projekt spustit bez domýšlení kroků.

V závěru stručně uveď:

1. co bylo vytvořeno;
2. důležitá architektonická rozhodnutí;
3. seznam změněných a nových souborů;
4. výsledky testů a buildu;
5. přesný postup spuštění;
6. známá omezení a co je nutné ověřit na fyzickém Vusion tagu.
```

## Co přiložit agentovi

Spolu s tímto promptem přilož, pokud je máš k dispozici:

1. `dithered_image.png`;
2. `image_data_array.c`;
3. případný existující repozitář nebo prázdnou cílovou složku;
4. později fotografie výsledku z fyzického tagu, podle kterých se potvrdí orientace a polarita rovin.

Prompt je záměrně omezen na editor a export. Rádiovou komunikaci a vykreslení ve firmwaru je vhodné řešit až v další fázi, protože nejprve potřebujeme stabilní, testovatelný zdroj obrazových dat.
