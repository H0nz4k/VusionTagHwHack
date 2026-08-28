# TAG Studio — dokumentace

Verze editoru: **0.3.0** · credit **HanzG**.

Uživatelský start: [`../README.md`](../README.md).  
Historie verzí: [`../CHANGELOG.md`](../CHANGELOG.md).

| Dokument | Obsah |
| --- | --- |
| [BWR_PATTERNS.md](BWR_PATTERNS.md) | 16 hardwarových 1×1 px výplní, ID, tile, poměry |
| [TEMPLATES.md](TEMPLATES.md) | Vestavěné šablony a BWR test 01–16 |
| [SCHEMA.md](SCHEMA.md) | `project.tagstudio.json` schema 3, migrace 1→2→3 |
| [CODEC.md](CODEC.md) | PNG/BIN/C, legacy vs CoG `0x10`/`0x13` |

Zdroj kódu registru vzorů: [`../src/core/bwrPatterns.ts`](../src/core/bwrPatterns.ts).  
Šablony: [`../src/core/templates.ts`](../src/core/templates.ts).  
Kodek: [`../src/core/codec.ts`](../src/core/codec.ts).

## Jistota

| Tvrzení | Kategorie |
| --- | --- |
| Paleta PNG je jen `#FFFFFF` / `#000000` / `#FF0000` | OVĚŘENO (render + testy) |
| Legacy BIN 296×152 = 11 248 B, MSB-first, W=1/1 B=0/1 R=0/0 | OVĚŘENO (fixture v0.1) |
| Vzory 01–16 mají kanonické tile a globální fázi plátna | OVĚŘENO (unit testy) |
| Logické CoG: W 0/0, B 1/0, R 0/1 | OVĚŘENO (měření CoG + unit test) |
| CoG BIN vykreslený touto předvolbou na skle EDG2-0260-A | zatím ne — HYPOTÉZA do flashe |

`0x10` a `0x13` jsou identifikátory příkazů CoG, ne bajty vkládané do obrazového BIN.
