# TAG Studio v0.2.0 – vývojový prompt

## Hotový prompt

```text
Rozšiř existující aplikaci TAG Studio v adresáři `tools/TagStudio` z verze 0.1.0 na verzi 0.2.0. Změny kompletně implementuj, otestuj a zdokumentuj. Neodevzdávej pouze analýzu, návrh algoritmů nebo UI mockup.

Hlavní cíle v0.2.0 jsou:

1. přidat kvalitnější dithering vhodný pro tříbarevné BWR e-paper displeje;
2. přidat skutečné projektové složky pojmenované datem a časem;
3. směrovat PNG, BIN, C a projektový JSON do aktivní složky projektu;
4. zachovat veškerou funkčnost, kompatibilitu a pixelovou přesnost v0.1.0.

## 1. Nejprve ověř skutečný stav projektu

- Přečti projektové instrukce, `README.md`, `CHANGELOG.md`, `package.json`, existující testy a relevantní zdrojové soubory.
- Neřiď se pouze tímto popisem. Ověř skutečné názvy typů, funkcí, komponent a datových struktur v repozitáři.
- Zachovej nesouvisející změny uživatele a nepřepisuj funkční části bez důvodu.
- Pracuj přímo nad existujícím `tools/TagStudio`; nezakládej paralelní přepis aplikace.
- Před změnami spusť dostupné testy, typecheck, lint a build a zaznamenej výchozí stav.
- Pokud repozitář obsahuje referenční `dithered_image.png` a `image_data_array.c`, ponech je jako regresní fixture.

Aktuální architektura je React + TypeScript + Vite s odděleným datovým modelem, renderovací pipeline, ditheringem, kodekem a exporty. Tuto hranici respektuj. Kodek PNG/BIN/C, mapování rovin a diagnostický round-trip nesmí nové ditheringové algoritmy rozbít.

## 2. Zachování funkcí v0.1.0

Beze ztráty zachovej minimálně:

- profily EDG2-0260-A 296 × 152 a EDG2-0420-B 400 × 300;
- vlastní rozměry a orientaci;
- vrstvy obrázků, textů, obdélníků a čar;
- transformace, pořadí, viditelnost, zámek a undo/redo;
- současné úpravy jasu, kontrastu, sytosti a citlivosti červené;
- stávající režimy bez ditheringu, Floyd–Steinberg, Atkinson a Bayer 4×4;
- ostré texty a tvary renderované až po ditheringu;
- přesnou paletu `#FFFFFF`, `#000000`, `#FF0000`;
- PNG bez alphy a pouze se třemi barvami;
- dvourovinný BIN a C export;
- výchozí mapování bílá A=1/B=1, černá A=0/B=1, červená A=0/B=0;
- MSB/LSB, pořadí a inverze rovin, otočení, flip a `SDCC __code`;
- diagnostické zpětné dekódování;
- projektový JSON, automatickou obnovu, českou diakritiku, offline provoz a credit HanzG.

Všechna dřívější regresní testovací očekávání musí nadále procházet.

## 3. Nové ditheringové režimy

Přidej algoritmy v tomto pořadí priority:

1. BWR dvoufázový režim – červená maska a samostatný černobílý dithering;
2. Sierra Lite;
3. Burkes;
4. Blue noise;
5. Ordered Bayer 2×2 a 8×8 vedle stávajícího Bayer 4×4.

Stucki a Jarvis–Judice–Ninke nyní neimplementuj. Připrav registr algoritmů tak, aby je šlo přidat v další verzi bez změny datového modelu celého editoru.

Každý režim musí:

- být deterministický při stejném vstupu a nastavení;
- vracet bitmapu v přesném cílovém rozlišení;
- obsahovat pouze tři indexy palety;
- nevytvářet mezilehlé RGB barvy ani alfu;
- fungovat pro landscape i portrait;
- nezměnit renderování textových a tvarových vrstev;
- být dostatečně rychlý pro živý náhled 400 × 300.

Organizuj algoritmy přes typovaný registr s ID, českým názvem, stručným popisem, kategorií a případnými parametry. Projekt nesmí ukládat pouze index položky selectu; ukládej stabilní ID algoritmu.

## 4. Sierra Lite

Implementuj plnohodnotný error-diffusion algoritmus Sierra Lite, včetně serpentinového průchodu. Použij standardní rozdělení chyby:

- ve směru průchodu následující pixel: 2/4;
- další řádek diagonálně dozadu: 1/4;
- další řádek ve stejném sloupci: 1/4.

Při průchodu zprava doleva kernel korektně zrcadli. Ošetři hranice bez přístupu mimo bitmapu.

## 5. Burkes

Implementuj Burkes error diffusion se serpentinovým průchodem a standardním jmenovatelem 32:

- aktuální řádek ve směru průchodu: 8, 4;
- následující řádek od dvou pixelů dozadu po dva dopředu: 2, 4, 8, 4, 2.

Kernel při opačném směru průchodu zrcadli. Algoritmus nesmí produkovat směrové chyby na sudých a lichých řádcích.

## 6. Blue noise

Přidej prahový blue-noise režim bez viditelné pravidelné Bayerovy mřížky.

- Použij pevnou deterministickou dlaždici, doporučeně 64 × 64, nebo deterministický generátor s pevným seedem.
- Nepoužívej `Math.random()` bez pevně řízeného generátoru.
- Pokud použiješ cizí datovou matici, ověř licenci, přidej atribuci a nevkládej nejasně licencovaný asset.
- Přidej ovladač intenzity/strength s rozumnou výchozí hodnotou.
- Opakování dlaždice nesmí posouvat výsledek mezi jednotlivými rendery.

## 7. Bayer

Vedle stávajícího Bayer 4×4 přidej samostatné režimy:

- Bayer 2×2 – hrubší, výraznější rastr;
- Bayer 8×8 – jemnější rastr s více úrovněmi pokrytí.

Matice normalizuj konzistentně a zachovej deterministický výstup. Stávající projekt používající Bayer 4×4 se po migraci musí zobrazit stejně jako ve v0.1.0.

## 8. BWR dvoufázový režim

Toto je hlavní funkce verze 0.2.0. Nejde o běžné přiřazení nejbližší ze tří barev.

Pipeline:

1. z upraveného RGB obrazu vypočti pro každý pixel pravděpodobnost/příslušnost k červenému akcentu;
2. vytvoř binární červenou masku pouze z dostatečně chromatických červených, oranžových a tmavě červených oblastí;
3. pixely v masce označ jako čistě červené;
4. zbylé pixely převeď na jas a ditheruj výhradně mezi černou a bílou;
5. slož červenou masku s černobílým výsledkem;
6. proveď konečnou normalizaci palety.

Základní požadavek: neutrální šedý, černý nebo bílý obraz nesmí při výchozím nastavení získat žádné náhodné červené pixely.

Pro detekci červené použij rozumný perceptuální model, například lineární RGB doplněný chromatičností nebo OKLab. Neomezuj detekci pouze na přesné `#FF0000`, protože červené akcenty ve zdrojových obrázcích bývají tmavé, oranžové nebo málo saturované. Současně musí existovat ochrana neutrálních barev.

UI dvoufázového režimu nabídne:

- citlivost červené;
- minimální chromatičnost/sytost;
- práh červené masky;
- přepínač „Chránit neutrální tóny“, výchozí zapnuto;
- volbu černobílého ditheringu pro druhou fázi;
- náhled samotné červené masky.

Černobílá druhá fáze umožní minimálně:

- bez ditheringu;
- Floyd–Steinberg;
- Atkinson, výchozí a doporučený;
- Sierra Lite;
- Burkes;
- Bayer 2×2, 4×4 a 8×8;
- Blue noise.

Pokud je to užitečné, znovu použij obecné kernelové jádro error diffusion, ale neslučuj algoritmy způsobem, který zhorší čitelnost nebo testovatelnost.

V pravém panelu stručně vysvětli, že BWR režim nejprve rezervuje červené akcenty a zbytek převádí pouze na černou a bílou. Nezahlcuj základní UI matematickými detaily.

## 9. Náhled a statistiky palety

Rozšiř stavový řádek nebo inspektor o počty a procenta:

- bílých pixelů;
- černých pixelů;
- červených pixelů;
- případných neplatných pixelů při diagnostickém dekódování.

U BWR režimu přidej snadno přepínatelný náhled „Výsledek / Červená maska“. Přepnutí náhledu nesmí měnit exportovaná data.

Volitelně můžeš přidat jednoduché porovnání aktuálního a předchozího ditheringu, ale pouze po dokončení a otestování povinného rozsahu.

## 10. Projektová složka při „Nový“

Když uživatel zvolí „Nový projekt“, aplikace vytvoří samostatnou projektovou složku s místním datem a časem. Výchozí název:

`TAG_Project_YYYY-MM-DD_HH-mm-ss`

Příklad:

`TAG_Project_2026-08-28_19-42-07`

Pravidla:

- použij místní čas uživatele, ne UTC;
- nepoužívej dvojtečky ani znaky neplatné ve Windows;
- datum a čas projektu vzniknou jednou a při dalších exportech se nemění;
- při kolizi stejného názvu vytvoř bezpečný suffix `_02`, `_03` atd.;
- folder name a `createdAt` ulož do projektu;
- nový projekt musí mít také stabilní `projectId`, například UUID;
- před opuštěním neuloženého projektu zachovej existující potvrzení ztráty změn.

## 11. File System Access API

Primární implementace pro aktuální Chrome a Edge použije File System Access API.

Bezpečný UX tok:

1. při prvním kliknutí na „Nový projekt“ vysvětli, že TAG Studio potřebuje vybrat hlavní pracovní složku;
2. z uživatelského kliknutí zavolej `showDirectoryPicker({ mode: "readwrite" })`;
3. ve zvoleném hlavním adresáři vytvoř přes `getDirectoryHandle(folderName, { create: true })` projektovou podsložku;
4. aktivní `FileSystemDirectoryHandle` používej pro projektový JSON a všechny exporty;
5. v UI vždy zobraz název aktivní projektové složky a stav oprávnění;
6. nabídni tlačítko „Změnit pracovní složku“ a „Znovu povolit přístup“.

Počítej s bezpečnostními vlastnostmi API:

- picker musí být vyvolaný uživatelským gestem;
- aplikace musí běžet v bezpečném kontextu; `localhost`/`127.0.0.1` používaný aplikací je preferovaný způsob lokálního spuštění;
- prohlížeč nemusí zpřístupnit plnou systémovou cestu, proto ji neslibuj ani nezobrazuj jako vymyšlenou hodnotu;
- oprávnění může po restartu prohlížeče vyžadovat nové potvrzení;
- ošetři `AbortError`, `NotAllowedError`, `SecurityError`, ztrátu oprávnění, nedostatek místa a selhání zápisu;
- zrušení pickeru nesmí zničit aktuální projekt.

Reference pro ověření implementace:

- Chrome File System Access API: https://developer.chrome.com/docs/capabilities/web-apis/file-system-access
- specifikace WICG: https://wicg.github.io/file-system-access/

Izoluj práci se souborovým systémem za typovanou službu/adaptér, aby šla testovat bez skutečného pickeru.

## 12. Zapamatování pracovního adresáře

Directory handle může být strukturovaně klonovatelný, ale nepatří do projektového JSON ani `localStorage`.

- Pokud prohlížeč podporuje uložení handle do IndexedDB, ulož jej tam odděleně od projektu.
- Při příštím spuštění nejprve ověř `queryPermission`, a pouze po uživatelské akci případně zavolej `requestPermission`.
- Nikdy nepředpokládej, že dříve uložený handle má stále oprávnění.
- Pokud obnovení selže, vyžádej opětovný výběr hlavní nebo konkrétní projektové složky.
- Dokumentuj, že oprávnění a IndexedDB jsou svázané s originem. Uživatelské spouštění proto směruj na stabilní adresu a port.

Uprav `start.cmd`/`start.ps1` tak, aby běžné uživatelské spuštění používalo stabilní origin. Nezaváděj náhodné porty. Vývojový režim může zůstat oddělený.

## 13. Obsah projektové složky

Aktivní složka projektu obsahuje minimálně:

- `project.tagstudio.json`;
- `tagstudio_<profil>_<šířka>x<výška>.png`;
- `tagstudio_<profil>_<šířka>x<výška>.bin`;
- `tagstudio_<profil>_<šířka>x<výška>.c`.

Použij existující bezpečnou sanitizaci názvů. Profil a rozměry odvozuj ze skutečného projektu, nevkládej hardcoded EDG2-0260-A.

Chování tlačítek:

- „Uložit projekt“ zapíše nebo aktualizuje `project.tagstudio.json` v aktivní složce;
- jednotlivé exporty PNG/BIN/C zapisují do stejné aktivní složky;
- přidej „Exportovat vše“, které v jednom průchodu připraví a zapíše projekt JSON, PNG, BIN a C;
- až po úspěšném zápisu všech položek ukaž souhrn úspěchu;
- částečné selhání nezataj: ukaž, které soubory byly zapsány a které selhaly;
- před přepsáním existujícího souboru nabídni „Přepsat“, „Uložit jako novou verzi“ nebo „Zrušit“;
- nová verze používá bezpečný suffix, například `_v02`, `_v03`;
- zápis souboru prováděj přes `createWritable()`, data zapiš a stream korektně uzavři;
- nevytvářej prázdný nebo částečný soubor při známé chybě renderu či exportu.

Po vytvoření nového projektu doporučeně ihned zapiš počáteční `project.tagstudio.json`, aby složka nebyla bez identifikace. Pokud zápis selže, projekt může zůstat otevřený, ale UI musí jasně ukázat stav „neuloženo“.

## 14. Otevření existujícího projektu

- Starý projekt otevřený přes současný file input musí nadále fungovat.
- Projekt v0.1.0 bez `projectId`, `createdAt` a `folderName` migruj v paměti na nové schéma a při uložení nabídni cílovou projektovou složku.
- Při otevření přes File System Access API umožni vybrat `project.tagstudio.json` nebo přímo projektovou složku.
- Nezakládej automaticky novou timestamp složku při otevření existujícího projektu.
- Pokud se podaří získat handle existující projektové složky, další exporty směřuj do ní.
- Pokud nelze vztah ke složce obnovit, zobraz stav „Projektová složka není připojena“ a vyžádej její výběr před přímým zápisem.

## 15. Fallback bez File System Access API

Aplikace nesmí přestat fungovat v prohlížeči bez `showDirectoryPicker` nebo při spuštění způsobem, který API nedovoluje.

Fallback:

- zachovej standardní stažení jednotlivých PNG/BIN/C/JSON souborů;
- „Exportovat vše“ stáhne jeden ZIP pojmenovaný stejně jako projektová složka a obsahující JSON, PNG, BIN a C;
- v UI jasně napiš, že prohlížeč nemůže automaticky vytvořit skutečnou složku a používá ZIP/download režim;
- aplikace nesmí tvrdit, že soubory uložila do konkrétní cesty, pokud pouze spustila download;
- fallback musí zůstat kompletně lokální a offline.

Použiješ-li knihovnu pro ZIP, zvol malou, aktivně udržovanou a licenčně kompatibilní závislost. Nepoužívej CDN.

## 16. Projektové schéma a migrace

Zvyš `schemaVersion` pouze tehdy, pokud to odpovídá skutečné změně uloženého formátu; očekává se migrace schema 1 → schema 2.

Nová metadata zahrnou minimálně:

- `projectId`;
- `createdAt` v ISO formátu;
- `modifiedAt`;
- `folderName`;
- nastavení nových ditheringových režimů;
- BWR parametry;
- blue-noise strength;
- zvolené ID černobílého algoritmu v BWR režimu.

Požadavky na migraci:

- projekty schema 1 se otevřou bez ztráty vrstev, obrázků, profilů a exportních nastavení;
- původní ID ditheringu se namapují na stejné vizuální režimy;
- chybějící nová nastavení dostanou dokumentované výchozí hodnoty;
- novější neznámé schéma se nadále bezpečně odmítne;
- migrace nesmí při pouhém otevření přepsat původní soubor.

## 17. UI a přístupnost

Zachovej kompaktní rozvržení použitelné na 1366 × 768.

Přidej:

- seskupení ditheringu do logických kategorií: Základní, Error diffusion, Ordered/Noise, BWR dvoufázový;
- stručný popis zvoleného algoritmu;
- BWR specifické ovladače pouze při aktivním BWR režimu;
- viditelný název a stav projektové složky;
- tlačítka Nový, Otevřít, Uložit projekt, Exportovat vše a změnit/připojit složku;
- srozumitelné průběhové a chybové stavy zápisu.

Nepřidávej velké dekorativní panely, které zmenší plátno. Ovladače musí být ovladatelné klávesnicí, mít labely a viditelný focus. Barevný stav nesmí být jediným nositelem informace.

## 18. Výkon

- Nepřepočítávej dithering vícekrát pro jeden exportní průchod.
- „Exportovat vše“ používá jeden autoritativní render pro PNG, BIN, C i diagnostiku.
- Debounce/throttle živého náhledu zachovej nebo zlepši.
- Blue noise a error diffusion nepřidávají viditelné blokování UI při 400 × 300.
- Pokud přesuneš výpočty do Web Workeru, zachovej deterministický výsledek a jednoduchou testovatelnost core funkcí.

## 19. Testy

Zachovej všechny existující testy a přidej minimálně:

### Dithering

- Sierra Lite používá správný kernel a serpentinový průchod;
- Burkes používá správný kernel a zrcadlení;
- Bayer 2×2, 4×4 a 8×8 mají očekávané deterministické vzory;
- Blue noise je deterministický a změna strength mění výsledek kontrolovaně;
- každý algoritmus vrací pouze WHITE/BLACK/RED;
- opakovaný render stejného vstupu je bitově totožný;
- obraz 296 × 152 a 400 × 300 zachová rozměry;
- orientace landscape/portrait funguje;
- text a tvary zůstávají po všech režimech ostré a paletové.

### BWR dvoufázový režim

- čistě šedý gradient při výchozím nastavení obsahuje 0 červených pixelů;
- čistě černý a čistě bílý vstup obsahuje 0 červených pixelů;
- červené, tmavě červené a přiměřeně oranžové testovací plochy vytvoří červenou masku;
- zelené, modré a neutrální plochy se při výchozím nastavení nestanou červenými;
- změna citlivosti a chroma threshold má očekávaný monotónní dopad;
- všechny volby druhé černobílé fáze vracejí pouze černou/bílou mimo masku;
- mask preview odpovídá skutečným červeným pixelům výsledku;
- exportní PNG/BIN/C odpovídají autoritativnímu výsledku.

### Projektové složky

- timestamp formatter používá lokální čas a formát bez dvojteček;
- s injektovanými hodinami vznikne přesný očekávaný folder name;
- kolize přidá `_02`, `_03`;
- sanitizace zabrání neplatným znakům a path traversal;
- „Nový projekt“ vytvoří jedinou podsložku a počáteční JSON;
- PNG, BIN, C a JSON jsou směrovány do stejného mock directory handle;
- „Exportovat vše“ používá správná jména a obsah;
- přepsání/version/cancel funguje;
- zrušený picker nezničí projekt;
- permission denied, revoked permission a chyba zápisu mají správné UI a nezatajovaný výsledek;
- handle persistence přes mock IndexedDB ověřuje oprávnění před použitím;
- fallback vytvoří ZIP se všemi čtyřmi soubory;
- schema 1 → 2 migrace zachová všechny dřívější vlastnosti;
- otevření existujícího projektu nevytvoří novou timestamp složku.

### Regrese exportu

- BIN zůstává 11 248 B pro 296 × 152 a 30 000 B pro 400 × 300;
- C inicializátor je bitově shodný s BIN a nepoužívá hardcoded velikost;
- `SDCC __code` zůstává funkční;
- encode/decode round-trip je beze změny;
- referenční fixture v0.1.0 stále prochází.

Pro časové testy nepoužívej skutečný systémový čas. Injektuj clock/time provider. Pro File System Access API použij mockované typované handly; automatické testy nesmí otevírat skutečný systémový picker.

Přidej nebo aktualizuj Playwright scénáře minimálně pro:

1. nový projekt → výběr kořenové složky přes mock → vznik timestamp podsložky;
2. nahrání obrázku → BWR dvoufázový Atkinson → export vše;
3. přepnutí mask/result preview bez změny exportu;
4. otevření schema 1 projektu → migrace → uložení do vybrané složky;
5. fallback bez File System Access API → ZIP download;
6. zamítnutí oprávnění a následné úspěšné znovupřipojení složky.

## 20. Dokumentace a verze

- Změň verzi v `package.json` a viditelném UI na `0.2.0`.
- Aktualizuj `CHANGELOG.md` s přehledem nových algoritmů, projektových složek, migrace a fallbacku.
- Aktualizuj český `README.md`.
- Popiš rozdíly algoritmů a doporučení:
  - text/loga: bez ditheringu;
  - komiksy/memy: BWR dvoufázový + Atkinson nebo Sierra Lite;
  - univerzální obraz: Burkes;
  - plochy/technická grafika: Bayer;
  - přirozenější zrno: Blue noise.
- Popiš výběr hlavní pracovní složky, timestamp podsložky, přímý zápis, obnovení oprávnění a fallback ZIP.
- Výslovně uveď, že prohlížeč z bezpečnostních důvodů nemůže bez souhlasu uživatele zapisovat do libovolné cesty.
- Uveď podporované prohlížeče a doporučené stabilní lokální URL.
- Zachovej dokumentaci fyzicky neověřené polarity/pořadí rovin.

## 21. Mimo rozsah v0.2.0

Neimplementuj nyní:

- Stucki ani Jarvis–Judice–Ninke;
- rádio, přenos obrazu nebo komunikaci s tagem;
- flashování CC2510;
- Tauri/Electron/Windows EXE;
- cloudové ukládání, účty nebo telemetrii;
- mobilní editor;
- jiné barevné palety než BWR;
- automatický přístup k libovolné systémové cestě bez uživatelského oprávnění.

## 22. Povinné ověření před dokončením

Spusť a oprav:

- TypeScript typecheck;
- ESLint;
- všechny unit/integration testy;
- všechny Playwright testy v podporovaném Chromium;
- produkční build;
- ruční smoke test aplikace přes doporučený stabilní localhost origin.

Ruční smoke test musí ověřit:

1. vytvoření projektu a fyzické podsložky;
2. uložení JSON/PNG/BIN/C do stejné složky;
3. opakovaný export a volbu přepsat/verzovat;
4. zavření a nové spuštění aplikace, kontrolu oprávnění a znovupřipojení;
5. BWR dvoufázový režim na barevném obrázku;
6. 0 červených pixelů na neutrálním grayscale testu;
7. otevření projektu v0.1.0;
8. fallback ZIP při vypnuté podpoře API.

Neuváděj, že něco prošlo, pokud jsi to skutečně nespustil. Selhání způsobené prostředím odliš od chyby implementace a popiš jeho dopad.

## 23. Definice hotového stavu

Úkol je hotový pouze tehdy, když:

- aplikace zobrazuje verzi 0.2.0;
- všechny funkce v0.1.0 zůstaly funkční;
- je implementováno všech pět požadovaných rozšíření ditheringu;
- BWR dvoufázový režim nezanáší červenou do neutrálních tónů;
- nový projekt vytvoří timestamp složku po udělení oprávnění;
- JSON, PNG, BIN a C se ukládají do aktivní projektové složky;
- existuje bezpečný fallback ZIP/download;
- staré schema 1 projekty lze otevřít a migrovat;
- kodek a velikosti exportů zůstaly pixelově správné;
- testy, typecheck, lint a build procházejí;
- dokumentace umožní uživateli funkci pochopit a spustit bez domýšlení.

## 24. Závěrečné předání

V závěru stručně, ale konkrétně uveď:

1. co bylo implementováno;
2. architekturu ditheringových algoritmů a BWR pipeline;
3. architekturu práce se složkami a fallback;
4. migraci schema 1 → 2;
5. seznam změněných a nových souborů;
6. přesné spuštěné příkazy a výsledky testů;
7. postup běžného spuštění ve Windows;
8. známá omezení a co je stále nutné ověřit na fyzickém tagu.

Neprováděj deployment, push ani externí zápisy. Commit vytvoř pouze tehdy, pokud je to výslovně součástí aktuálního pracovního postupu nebo o něj uživatel požádá.
```

## Poznámka k ukládání složek

Čistá webová aplikace nemůže bez souhlasu uživatele libovolně vytvářet složky na disku. File System Access API však v podporovaném Chromiu umožní po výběru hlavní složky vytvářet projektové podsložky a zapisovat do nich soubory. Picker musí být vyvolán uživatelskou akcí a aplikace musí pracovat v bezpečném kontextu. Proto prompt obsahuje přímý režim pro Chrome/Edge a ZIP fallback pro ostatní situace.
