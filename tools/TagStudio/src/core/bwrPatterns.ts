import { BLACK, RED, WHITE, type BwrPatternId, type PaletteIndex } from "./types";

export type { BwrPatternId };

export type BwrPatternCategory = "solid" | "white-black" | "white-red" | "black-red" | "three-color";

export interface BwrPatternInfo {
  id: BwrPatternId;
  number: number;
  name: string;
  description: string;
  category: BwrPatternCategory;
  /** Řádky tile: `.` bílá, `#` černá, `@` červená. */
  tile: string[];
  ratio: { w: number; b: number; r: number };
}

const SYM: Record<string, PaletteIndex> = { ".": WHITE, "#": BLACK, "@": RED };

function p(
  id: BwrPatternId,
  number: number,
  name: string,
  description: string,
  category: BwrPatternCategory,
  tile: string[],
): BwrPatternInfo {
  const counts = { w: 0, b: 0, r: 0 };
  for (const row of tile) {
    for (const ch of row) {
      if (ch === ".") counts.w += 1;
      else if (ch === "#") counts.b += 1;
      else if (ch === "@") counts.r += 1;
    }
  }
  const n = counts.w + counts.b + counts.r;
  return {
    id,
    number,
    name,
    description,
    category,
    tile,
    ratio: {
      w: (counts.w / n) * 100,
      b: (counts.b / n) * 100,
      r: (counts.r / n) * 100,
    },
  };
}

export const BWR_PATTERNS: BwrPatternInfo[] = [
  p("bwr-01-white", 1, "Plná bílá", "Solidní bílá, bez rastru.", "solid", ["."]),
  p("bwr-02-black", 2, "Plná černá", "Solidní černá, bez rastru.", "solid", ["#"]),
  p("bwr-03-red", 3, "Plná červená", "Solidní červená, bez rastru.", "solid", ["@"]),
  p("bwr-04-gray-25", 4, "Světle šedá", "Bílá 75 % / černá 25 %.", "white-black", ["..", "#."]),
  p("bwr-05-gray-50", 5, "Střední šedá", "Šachovnice bílá/černá 50/50.", "white-black", [".#", "#."]),
  p("bwr-06-gray-75", 6, "Tmavě šedá", "Bílá 25 % / černá 75 %.", "white-black", [".#", "##"]),
  p("bwr-07-pink-25", 7, "Světle růžová", "Bílá 75 % / červená 25 %.", "white-red", ["..", ".@"]),
  p("bwr-08-red-50", 8, "Střední červená", "Šachovnice bílá/červená 50/50.", "white-red", ["@.", ".@"]),
  p("bwr-09-red-75", 9, "Sytá červená", "Bílá 25 % / červená 75 %.", "white-red", ["@@", "@."]),
  p("bwr-10-darkred-25", 10, "Tmavá červená", "Černá 75 % / červená 25 %.", "black-red", ["##", "@#"]),
  p("bwr-11-redblack-50", 11, "Červená a černá 50/50", "Šachovnice červená/černá.", "black-red", ["@#", "#@"]),
  p("bwr-12-red-black-25", 12, "Červená s černým rastrem", "Černá 25 % / červená 75 %.", "black-red", ["@@", "#@"]),
  p("bwr-13-rgb-33", 13, "Tříbarevná diagonála", "Bílá/černá/červená po 33⅓ %.", "three-color", ["#@.", "@.#", ".#@"]),
  p("bwr-14-w50-b25-r25", 14, "Bílá 50 %", "Bílá 50 %, černá 25 %, červená 25 %.", "three-color", ["..", "#@"]),
  p("bwr-15-w25-b50-r25", 15, "Černá 50 %", "Černá 50 %, bílá 25 %, červená 25 %.", "three-color", ["##", "@."]),
  p("bwr-16-red50", 16, "Červená 50 %", "Červená 50 %, bílá 25 %, černá 25 %.", "three-color", ["@@", ".#"]),
];

const BY_ID = new Map(BWR_PATTERNS.map((x) => [x.id, x]));

export function isBwrPatternId(value: string): value is BwrPatternId {
  return BY_ID.has(value as BwrPatternId);
}

export function getBwrPattern(id: BwrPatternId): BwrPatternInfo {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Neznámý BWR vzor: ${id}`);
  return found;
}

export function sampleBwrPattern(id: BwrPatternId, canvasX: number, canvasY: number): PaletteIndex {
  const info = getBwrPattern(id);
  const h = info.tile.length;
  const w = info.tile[0].length;
  const x = ((canvasX % w) + w) % w;
  const y = ((canvasY % h) + h) % h;
  const ch = info.tile[y][x];
  return SYM[ch] ?? WHITE;
}

export function patternsByGroup(): Array<{ label: string; items: BwrPatternInfo[] }> {
  return [
    { label: "Solidní", items: BWR_PATTERNS.filter((p) => p.number <= 3) },
    { label: "Bílá / černá", items: BWR_PATTERNS.filter((p) => p.number >= 4 && p.number <= 6) },
    { label: "Bílá / červená", items: BWR_PATTERNS.filter((p) => p.number >= 7 && p.number <= 9) },
    { label: "Černá / červená", items: BWR_PATTERNS.filter((p) => p.number >= 10 && p.number <= 12) },
    { label: "Tříbarevné", items: BWR_PATTERNS.filter((p) => p.number >= 13) },
  ];
}

export function tileHasOnlyWbr(tile: string[]): boolean {
  return tile.every((row) => [...row].every((ch) => ch === "." || ch === "#" || ch === "@"));
}
