# Projektové schéma 3

Soubor: `project.tagstudio.json`.  
Aktuální `schemaVersion`: **3**.

Otevření staršího souboru proběhne **v paměti**. Samotné otevření soubor na disku nepřepíše. Uložení zapíše schema 3. Schema **> 3** se odmítne.

## `FillStyle`

```ts
type FillStyle =
  | { kind: "none" }
  | { kind: "solid"; color: "white" | "black" | "red" }
  | { kind: "bwr-pattern"; patternId: BwrPatternId };
```

`none` je pro výplň/obrys obdélníku (žádná kresba). Pozadí plátna `none` se při načtení nahradí solidní bílou.

Neznámé `patternId` se při parse zahodí a použije se fallback výplně. Tile se do JSON **neukládá**.

## Kořen projektu

| Pole | Poznámka |
| --- | --- |
| `schemaVersion` | 3 |
| `projectId` | UUID, nové u každé šablony / Nový |
| `createdAt`, `modifiedAt` | ISO-8601 |
| `folderName` | `TAG_Project_YYYY-MM-DD_HH-mm-ss` (místní čas) |
| `profileId`, `orientation`, `canvasWidth`, `canvasHeight` | plátno |
| `customWidth`, `customHeight` | jen profil `custom` |
| `background` | `FillStyle` (výchozí solid white) |
| `layers` | image / text / rect / line |
| `dither` | včetně `bwr` a `blueNoiseStrength` (schema 2+) |
| `safeMargin`, `showSafeMargin`, `showPixelGrid` | UI, okraj se neexportuje |
| `export` | včetně `planeMap` |

## Vrstvy a výplně

- **rect:** `fill`, `stroke` jsou `FillStyle`; staré řetězce `"black"` / `"none"` se migrují.
- **text:** `fill` je `FillStyle`; `color` zůstává pro obrys a kompatibilitu. Chybí-li `fill`, bere se `solid` z `color`.
- **line:** pořád `color` + `thickness` (solidní paletová barva).
- **image:** beze změny vůči schema 2 (data URL, výřez, dither vrstvy).

## Migrace

| Z | Na | Chování |
| --- | --- | --- |
| 1 | 3 | jako 1→2 (metadata, BWR výchozí) + výplně na `solid` / `none`, `background`, `planeMap: "legacy"` |
| 2 | 3 | řetězcové barvy → `FillStyle`, doplní `background` a `planeMap` |
| 3 | 3 | validace ID vzorů |

Dither ID z v0.1 (`none`, `floyd-steinberg`, `atkinson`, `ordered`) se nemění.

## Příklad výplně

```json
{
  "fill": { "kind": "bwr-pattern", "patternId": "bwr-05-gray-50" },
  "stroke": { "kind": "none" }
}
```
