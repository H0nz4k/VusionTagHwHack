import { BWR_PATTERNS, type BwrPatternId } from "./bwrPatterns";
import { BLACK_FILL, NONE_FILL, RED_FILL, WHITE_FILL, patternFill, solidFill } from "./fillStyle";
import {
  createProject,
  createRectLayer,
  createTextLayer,
  type CreateProjectOptions,
} from "./project";
import type { Layer, Orientation, ProfileId, Project, RectLayer, TextLayer } from "./types";

export type TemplateId =
  | "blank"
  | "bwr-color-test-01-16"
  | "image-captions"
  | "heading-info"
  | "product-price"
  | "three-color-split";

export type TemplateCategory = "blank" | "test" | "layout";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  category: TemplateCategory;
  description: string;
  profiles: ProfileId[] | "all";
  build: (ctx: TemplateContext) => Project;
}

export interface TemplateContext {
  profileId?: ProfileId;
  orientation?: Orientation;
  customWidth?: number | null;
  customHeight?: number | null;
  options?: CreateProjectOptions;
}

function baseProject(ctx: TemplateContext, profileId: ProfileId = "EDG2-0260-A"): Project {
  return createProject(
    ctx.profileId ?? profileId,
    ctx.orientation ?? "landscape",
    ctx.customWidth ?? null,
    ctx.customHeight ?? null,
    ctx.options ?? {},
  );
}

function add(project: Project, layers: Layer[]): Project {
  return { ...project, layers };
}

function rect(
  project: Project,
  patch: Partial<RectLayer> & Pick<RectLayer, "x" | "y" | "width" | "height">,
): RectLayer {
  return { ...createRectLayer(project), ...patch };
}

function text(
  project: Project,
  patch: Partial<TextLayer> & Pick<TextLayer, "x" | "y" | "text">,
): TextLayer {
  const color = patch.color ?? "black";
  return {
    ...createTextLayer(project),
    fill: patch.fill ?? solidFill(color),
    color,
    ...patch,
  };
}

function buildBlank(ctx: TemplateContext): Project {
  return baseProject(ctx);
}

function buildBwrTest(ctx: TemplateContext): Project {
  const project = createProject("EDG2-0260-A", "landscape", null, null, ctx.options ?? {});
  const cellW = 74;
  const cellH = 38;
  const layers: Layer[] = [];
  BWR_PATTERNS.forEach((pat, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = col * cellW;
    const y = row * cellH;
    layers.push(
      rect(project, {
        name: `Pole ${String(pat.number).padStart(2, "0")}`,
        x,
        y,
        width: cellW,
        height: cellH,
        fill: patternFill(pat.id),
        stroke: NONE_FILL,
        strokeWidth: 0,
      }),
    );
    const dark = pat.ratio.w < 40;
    const boxFill = dark ? WHITE_FILL : BLACK_FILL;
    const labelColor = dark ? "black" : "white";
    layers.push(
      rect(project, {
        name: `Rámeček ${String(pat.number).padStart(2, "0")}`,
        x: x + 2,
        y: y + 2,
        width: 18,
        height: 11,
        fill: boxFill,
        stroke: NONE_FILL,
        strokeWidth: 0,
      }),
    );
    layers.push(
      text(project, {
        name: `Číslo ${String(pat.number).padStart(2, "0")}`,
        x: x + 3,
        y: y + 2,
        width: 16,
        height: 11,
        text: String(pat.number).padStart(2, "0"),
        color: labelColor,
        fill: solidFill(labelColor),
        fontSize: 9,
        bold: true,
        align: "left",
      }),
    );
  });
  return add(project, layers);
}

function buildCaptions(ctx: TemplateContext): Project {
  const project = baseProject(ctx);
  const m = Math.min(6, project.safeMargin || 6);
  const w = project.canvasWidth;
  const h = project.canvasHeight;
  return add(project, [
    rect(project, {
      name: "Zástupný obraz",
      x: m,
      y: 28,
      width: w - m * 2,
      height: h - 56,
      fill: patternFill("bwr-05-gray-50"),
      stroke: NONE_FILL,
      strokeWidth: 0,
    }),
    text(project, {
      name: "Horní titulek",
      x: m,
      y: 4,
      width: w - m * 2,
      height: 22,
      text: "Horní titulek",
      color: "black",
      fontSize: 16,
      bold: true,
    }),
    text(project, {
      name: "Dolní titulek",
      x: m,
      y: h - 24,
      width: w - m * 2,
      height: 20,
      text: "Dolní titulek",
      color: "black",
      fontSize: 14,
      bold: false,
    }),
  ]);
}

function buildHeading(ctx: TemplateContext): Project {
  const project = baseProject(ctx);
  const m = Math.min(6, project.safeMargin || 6);
  const w = project.canvasWidth;
  const h = project.canvasHeight;
  return add(project, [
    rect(project, {
      name: "Pruh",
      x: 0,
      y: 0,
      width: w,
      height: 8,
      fill: RED_FILL,
      stroke: NONE_FILL,
      strokeWidth: 0,
    }),
    text(project, {
      name: "Nadpis",
      x: m,
      y: 14,
      width: w - m * 2,
      height: Math.min(40, h / 3),
      text: "Nadpis štítku",
      color: "black",
      fontSize: Math.min(28, Math.round(h / 6)),
      bold: true,
    }),
    text(project, {
      name: "Informace",
      x: m,
      y: Math.min(h - 50, 58),
      width: w - m * 2,
      height: h - 70,
      text: "Doplňující informace\ndruhý řádek",
      color: "black",
      fontSize: 14,
      bold: false,
    }),
  ]);
}

function buildProduct(ctx: TemplateContext): Project {
  const project = baseProject(ctx);
  const m = Math.min(6, project.safeMargin || 6);
  const w = project.canvasWidth;
  const h = project.canvasHeight;
  return add(project, [
    text(project, {
      name: "Název",
      x: m,
      y: m,
      width: w - m * 2,
      height: 22,
      text: "Název produktu",
      color: "black",
      fontSize: 14,
      bold: true,
    }),
    text(project, {
      name: "Cena",
      x: m,
      y: Math.round(h * 0.28),
      width: w - m * 2,
      height: Math.round(h * 0.4),
      text: "99 Kč",
      color: "red",
      fill: RED_FILL,
      fontSize: Math.min(42, Math.round(h / 3.2)),
      bold: true,
    }),
    text(project, {
      name: "Doplněk",
      x: m,
      y: h - 28,
      width: w - m * 2,
      height: 20,
      text: "za kus",
      color: "black",
      fontSize: 12,
    }),
  ]);
}

function buildSplit(ctx: TemplateContext): Project {
  const project = baseProject(ctx);
  const w = project.canvasWidth;
  const h = project.canvasHeight;
  const third = Math.floor(w / 3);
  return add(project, [
    rect(project, {
      name: "Černá",
      x: 0,
      y: 0,
      width: third,
      height: h,
      fill: BLACK_FILL,
      stroke: NONE_FILL,
      strokeWidth: 0,
    }),
    rect(project, {
      name: "Červená",
      x: third,
      y: 0,
      width: third,
      height: h,
      fill: RED_FILL,
      stroke: NONE_FILL,
      strokeWidth: 0,
    }),
    rect(project, {
      name: "Vzor",
      x: third * 2,
      y: 0,
      width: w - third * 2,
      height: h,
      fill: patternFill("bwr-05-gray-50" satisfies BwrPatternId),
      stroke: NONE_FILL,
      strokeWidth: 0,
    }),
  ]);
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "blank",
    name: "Prázdná",
    category: "blank",
    description: "Čistý projekt bez vrstev.",
    profiles: "all",
    build: buildBlank,
  },
  {
    id: "bwr-color-test-01-16",
    name: "BWR barevný test 01–16",
    category: "test",
    description: "Hardwarový vzorník bílé, černé, červené a jejich optických směsí.",
    profiles: ["EDG2-0260-A"],
    build: buildBwrTest,
  },
  {
    id: "image-captions",
    name: "Obrázek + horní a dolní titulek",
    category: "layout",
    description: "Meme / plakát: zástupné pole a ostré titulky.",
    profiles: "all",
    build: buildCaptions,
  },
  {
    id: "heading-info",
    name: "Velký nadpis + informační blok",
    category: "layout",
    description: "Univerzální informační štítek.",
    profiles: "all",
    build: buildHeading,
  },
  {
    id: "product-price",
    name: "Produkt / cena",
    category: "layout",
    description: "Výrazná cena, název a doplňkový text.",
    profiles: "all",
    build: buildProduct,
  },
  {
    id: "three-color-split",
    name: "Tříbarevné rozdělení",
    category: "layout",
    description: "Černá, červená a jeden BWR vzor vedle sebe.",
    profiles: "all",
    build: buildSplit,
  },
];

export function getTemplate(id: TemplateId): TemplateInfo {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`Neznámá šablona: ${id}`);
  return t;
}

export function createProjectFromTemplate(id: TemplateId, ctx: TemplateContext = {}): Project {
  return getTemplate(id).build(ctx);
}

export const BWR_TEST_CELL = { width: 74, height: 38, cols: 4, rows: 4 } as const;
