# Šablony

Galerie se otevře tlačítkem **Nový**. Šablony jsou lokální, deterministické a fungují offline. Po vytvoření je projekt samostatný — nezávisí na budoucí existenci definice šablony.

Stejná cesta jako dřív: Chrome/Edge vybere pracovní složku, vznikne `TAG_Project_YYYY-MM-DD_HH-mm-ss` a `project.tagstudio.json`. Bez File System Access API zůstane download / ZIP fallback.

Neuložené změny se před založením nového projektu potvrzují.

## Sada 0.3.0

| ID | Název | Kategorie | Profily |
| --- | --- | --- | --- |
| `blank` | Prázdná | Základ | všechny |
| `bwr-color-test-01-16` | BWR barevný test 01–16 | Testovací | jen EDG2-0260-A |
| `image-captions` | Obrázek + horní a dolní titulek | Rozvržení | všechny |
| `heading-info` | Velký nadpis + informační blok | Rozvržení | všechny |
| `product-price` | Produkt / cena | Rozvržení | všechny |
| `three-color-split` | Tříbarevné rozdělení | Rozvržení | všechny |

Obecné šablony používají aktuální profil, orientaci a bezpečný okraj 4–6 px. Zástupné texty se přepisují v editoru. Cizí loga ani další fonty se nevkládají (Inter OFL je už v aplikaci).

## BWR barevný test 01–16

- profil EDG2-0260-A, landscape, **přesně 296 × 152 px**;
- mřížka 4 × 4, buňka **74 × 38 px**;
- pořadí zleva doprava, shora dolů: 01–04, 05–08, 09–12, 13–16;
- pole = kanonický vzor z registru;
- číslo v malém kontrastním rámečku (ostrý text, paletové barvy);
- plátno se okrajem **nezvětšuje**.

Složení je z vrstev editoru (obdélník + rámeček + text), ne z jednoho neprůhledného bitmapu.

Popis v galerii: „Hardwarový vzorník bílé, černé, červené a jejich optických směsí.“
