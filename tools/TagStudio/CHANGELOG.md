# Changelog

## 0.3.0 — 2026-08-28

- Vestavěné šablony při **Nový**: prázdná, BWR barevný test 01–16 (EDG2-0260-A 296×152), obrázek + titulky, nadpis + informace, produkt/cena, tříbarevné rozdělení.
- Hardwarově ověřené BWR výplně 01–16 jako 1×1 px vzory z bílé/černé/červené (ne další RGB barvy). Ukotvení ke globálním souřadnicím plátna, ostrá vrstva po ditheringu rastru.
- Paleta výplní pro pozadí, obdélníky a text; varování u malého vzorovaného textu.
- Projektové schéma 3: `FillStyle` (`none` / `solid` / `bwr-pattern` + ID), `background`, `export.planeMap`. Schema 1 a 2 se otevřou v paměti, soubor se při otevření nepřepíše.
- Pojmenovaná předvolba BIN **CoG EDG2-0260-A** (logické 0x10/0x13: W 0/0, B 1/0, R 0/1). Výchozí kodek zůstává **legacy** v0.1/v0.2. Hodnoty 0x10 a 0x13 se do BIN nevkládají.
- Dokumentace v `docs/` (vzory, šablony, schema 3, kodek). Referenční PNG vzorníku je v `testPIC/small_296x152/`.
- Verze v UI `0.3.0`. Credit **HanzG**.

## 0.2.0 — 2026-08-28

- Dithering: Sierra Lite, Burkes, Blue noise (64×64, pevný seed), Bayer 2×2 a 8×8 vedle stávajícího Bayer 4×4 (`ordered`).
- BWR dvoufázový režim: červená maska + samostatný černobílý dithering (výchozí Atkinson), ochrana neutrálních tónů, náhled masky.
- Registr algoritmů se stabilními ID; projekt neukládá index v `<select>`.
- Projektové schéma 2: `projectId`, `createdAt`, `modifiedAt`, `folderName`, BWR a blue-noise nastavení. Schema 1 se otevře a migrace v paměti.
- Projektové složky `TAG_Project_YYYY-MM-DD_HH-mm-ss` přes File System Access API (Chrome/Edge), IndexedDB pro handle pracovní složky.
- PNG, BIN, C a `project.tagstudio.json` se zapisují do aktivní složky; Exportovat vše; konflikt Přepsat / verze / Zrušit.
- Fallback bez FS API: stažení souborů a ZIP (`fflate`).
- Statistiky palety B/Č/R ve stavovém řádku.
- Verze v UI `0.2.0`. Kodek a referenční fixture v0.1.0 beze změny.

## 0.1.0 — 2026-08-28

- První verze lokálního editoru TAG Studio (React + TypeScript + Vite).
- Profily Vusion EDG2-0260-A (296×152) a EDG2-0420-B (400×300), vlastní rozměr a orientace.
- Vrstvy: rastr (PNG/JPEG/WebP), ostrý text s českou diakritikou, obdélník, čára.
- Dithering: nejbližší barva, Floyd–Steinberg (serpentine), Atkinson, Bayer 4×4.
- Export PNG (přesná paleta), BIN dvou 1bitových rovin a C pole bez hardcoded velikosti.
- Pokročilé transformace exportu a diagnostické zpětné dekódování.
- Projekt `*.tagstudio.json`, undo/redo, lokální autosave.
- Referenční fixture `dithered_image.png` / `image_data_array.c` ověřena jednotkovým testem.
