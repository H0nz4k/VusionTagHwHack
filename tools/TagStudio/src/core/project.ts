import {
  SCHEMA_VERSION,
  defaultBwrSettings,
  defaultDitherSettings,
  defaultExportSettings,
  newId,
  type DitherSettings,
  type ImageLayer,
  type Layer,
  type LineLayer,
  type Orientation,
  type ProfileId,
  type Project,
  type RectLayer,
  type TextLayer,
} from "./types";
import { canvasSizeFor, validateCustomSize } from "./profiles";
import { type Clock, defaultClock, formatProjectFolderName } from "./folder";
import { isBwPhaseId, migrateV1DitherMode } from "./ditherRegistry";
import { NONE_FILL, BLACK_FILL, WHITE_FILL, parseFillStyle, solidFill } from "./fillStyle";

export class ProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectError";
  }
}

export interface CreateProjectOptions {
  clock?: Clock;
  projectId?: string;
  folderName?: string;
}

export function createProject(
  profileId: ProfileId = "EDG2-0260-A",
  orientation: Orientation = "landscape",
  customWidth: number | null = null,
  customHeight: number | null = null,
  options: CreateProjectOptions = {},
): Project {
  if (profileId === "custom") {
    const err = validateCustomSize(customWidth ?? 0, customHeight ?? 0);
    if (err) throw new ProjectError(err);
  }
  const size = canvasSizeFor(profileId, orientation, customWidth, customHeight);
  const now = (options.clock ?? defaultClock)();
  return {
    schemaVersion: SCHEMA_VERSION,
    projectId: options.projectId ?? newId(),
    createdAt: now.toISOString(),
    modifiedAt: now.toISOString(),
    folderName: options.folderName ?? formatProjectFolderName(now),
    profileId,
    customWidth: profileId === "custom" ? size.width : null,
    customHeight: profileId === "custom" ? size.height : null,
    orientation,
    canvasWidth: size.width,
    canvasHeight: size.height,
    layers: [],
    dither: defaultDitherSettings(),
    background: { kind: "solid", color: "white" },
    safeMargin: 6,
    showSafeMargin: true,
    showPixelGrid: false,
    export: defaultExportSettings(),
  };
}

export function touchModified(project: Project, clock: Clock = defaultClock): Project {
  return { ...project, modifiedAt: clock().toISOString() };
}

export function cloneProject(project: Project): Project {
  return structuredClone(project);
}

export function serializeProject(project: Project): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function parseProjectJson(text: string, clock: Clock = defaultClock): Project {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ProjectError("Soubor projektu není platný JSON.");
  }
  if (!data || typeof data !== "object") throw new ProjectError("Soubor projektu je prázdný.");
  const obj = data as Record<string, unknown>;
  if (typeof obj.schemaVersion !== "number") {
    throw new ProjectError("Chybí schemaVersion.");
  }
  if (obj.schemaVersion > SCHEMA_VERSION) {
    throw new ProjectError(
      `Projekt používá novější schéma (${obj.schemaVersion}) než tato verze TAG Studio (${SCHEMA_VERSION}).`,
    );
  }
  if (obj.schemaVersion < 1) {
    throw new ProjectError(`Nepodporovaná schemaVersion ${obj.schemaVersion}.`);
  }
  if (!obj.canvasWidth || !obj.canvasHeight) {
    throw new ProjectError("Projekt nemá platné rozměry plátna.");
  }
  if (!Array.isArray(obj.layers)) {
    throw new ProjectError("Projekt nemá pole vrstev.");
  }
  return migrateToV3(obj, clock);
}

export function migrateToV2(obj: Record<string, unknown>, clock: Clock = defaultClock): Project {
  return migrateToV3(obj, clock);
}

export function migrateToV3(obj: Record<string, unknown>, clock: Clock = defaultClock): Project {
  const now = clock();
  const ditherIn = (obj.dither ?? {}) as Record<string, unknown>;
  const defaults = defaultDitherSettings();
  const bwrIn = (ditherIn.bwr ?? {}) as Record<string, unknown>;
  const bwrDef = defaultBwrSettings();
  const dither: DitherSettings = {
    mode: migrateV1DitherMode(ditherIn.mode),
    brightness: num(ditherIn.brightness, defaults.brightness),
    contrast: num(ditherIn.contrast, defaults.contrast),
    saturation: num(ditherIn.saturation, defaults.saturation),
    redSensitivity: num(ditherIn.redSensitivity, defaults.redSensitivity),
    blueNoiseStrength: num(ditherIn.blueNoiseStrength, defaults.blueNoiseStrength),
    bwr: {
      minChroma: num(bwrIn.minChroma, bwrDef.minChroma),
      maskThreshold: num(bwrIn.maskThreshold, bwrDef.maskThreshold),
      protectNeutrals: typeof bwrIn.protectNeutrals === "boolean" ? bwrIn.protectNeutrals : bwrDef.protectNeutrals,
      bwPhase: typeof bwrIn.bwPhase === "string" && isBwPhaseId(bwrIn.bwPhase) ? bwrIn.bwPhase : bwrDef.bwPhase,
    },
  };
  return {
    schemaVersion: SCHEMA_VERSION,
    projectId: typeof obj.projectId === "string" && obj.projectId ? obj.projectId : newId(),
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : now.toISOString(),
    modifiedAt: typeof obj.modifiedAt === "string" ? obj.modifiedAt : now.toISOString(),
    folderName: typeof obj.folderName === "string" && obj.folderName ? obj.folderName : formatProjectFolderName(now),
    profileId: (obj.profileId as Project["profileId"]) ?? "EDG2-0260-A",
    customWidth: (obj.customWidth as number | null) ?? null,
    customHeight: (obj.customHeight as number | null) ?? null,
    orientation: obj.orientation === "portrait" ? "portrait" : "landscape",
    canvasWidth: Number(obj.canvasWidth),
    canvasHeight: Number(obj.canvasHeight),
    layers: (obj.layers as unknown[]).map(migrateLayer),
    dither,
    background: parseFillStyle(obj.background, WHITE_FILL).kind === "none" ? WHITE_FILL : parseFillStyle(obj.background, WHITE_FILL),
    safeMargin: num(obj.safeMargin, 6),
    showSafeMargin: typeof obj.showSafeMargin === "boolean" ? obj.showSafeMargin : true,
    showPixelGrid: typeof obj.showPixelGrid === "boolean" ? obj.showPixelGrid : false,
    export: migrateExport(obj.export),
  };
}

function migrateLayer(raw: unknown): Layer {
  const obj = (raw ?? {}) as Record<string, unknown>;
  if (obj.type === "rect") {
    return {
      ...(obj as unknown as RectLayer),
      fill: parseFillStyle(obj.fill, NONE_FILL),
      stroke: parseFillStyle(obj.stroke, BLACK_FILL),
    };
  }
  if (obj.type === "text") {
    const color = obj.color === "white" || obj.color === "red" ? obj.color : "black";
    return {
      ...(obj as unknown as TextLayer),
      color,
      fill: obj.fill !== undefined ? parseFillStyle(obj.fill, solidFill(color)) : solidFill(color),
    };
  }
  return obj as unknown as Layer;
}

function migrateExport(raw: unknown): Project["export"] {
  const base = defaultExportSettings();
  if (typeof raw !== "object" || raw === null) return base;
  const obj = raw as Record<string, unknown>;
  const rotate = obj.rotate;
  return {
    bitOrder: obj.bitOrder === "lsb-first" ? "lsb-first" : "msb-first",
    planeOrder: obj.planeOrder === "b-then-a" ? "b-then-a" : "a-then-b",
    invertA: obj.invertA === true,
    invertB: obj.invertB === true,
    rotate: rotate === 90 || rotate === 180 || rotate === 270 ? rotate : 0,
    flipX: obj.flipX === true,
    flipY: obj.flipY === true,
    cArrayName: typeof obj.cArrayName === "string" && obj.cArrayName ? obj.cArrayName : base.cArrayName,
    sdccCode: obj.sdccCode === true,
    planeMap: obj.planeMap === "cog-edg2-0260-a" ? "cog-edg2-0260-a" : "legacy",
  };
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export type CanvasChangeMode = "fit" | "keep" | "cancel";

export function applyProfileChange(
  project: Project,
  next: {
    profileId: ProfileId;
    orientation: Orientation;
    customWidth?: number | null;
    customHeight?: number | null;
  },
  mode: Exclude<CanvasChangeMode, "cancel">,
): Project {
  if (next.profileId === "custom") {
    const err = validateCustomSize(next.customWidth ?? 0, next.customHeight ?? 0);
    if (err) throw new ProjectError(err);
  }
  const size = canvasSizeFor(next.profileId, next.orientation, next.customWidth, next.customHeight);
  const out = cloneProject(project);
  const sx = size.width / project.canvasWidth;
  const sy = size.height / project.canvasHeight;
  out.profileId = next.profileId;
  out.orientation = next.orientation;
  out.customWidth = next.profileId === "custom" ? size.width : null;
  out.customHeight = next.profileId === "custom" ? size.height : null;
  out.canvasWidth = size.width;
  out.canvasHeight = size.height;
  if (mode === "fit") {
    out.layers = out.layers.map((layer) => scaleLayer(layer, sx, sy));
  }
  return out;
}

function scaleLayer(layer: Layer, sx: number, sy: number): Layer {
  if (layer.type === "line") {
    return { ...layer, x1: layer.x1 * sx, y1: layer.y1 * sy, x2: layer.x2 * sx, y2: layer.y2 * sy };
  }
  return {
    ...layer,
    x: layer.x * sx,
    y: layer.y * sy,
    width: layer.width * sx,
    height: layer.height * sy,
  };
}

export function nextLayerName(layers: Layer[], prefix: string): string {
  let n = 1;
  const names = new Set(layers.map((l) => l.name));
  while (names.has(`${prefix} ${n}`)) n += 1;
  return `${prefix} ${n}`;
}

export function createImageLayer(
  project: Project,
  opts: { dataUrl: string; srcWidth: number; srcHeight: number; name?: string },
): ImageLayer {
  const fit = fitContain(opts.srcWidth, opts.srcHeight, project.canvasWidth, project.canvasHeight);
  return {
    type: "image",
    id: newId(),
    name: opts.name ?? nextLayerName(project.layers, "Obrázek"),
    visible: true,
    locked: false,
    x: fit.x,
    y: fit.y,
    width: fit.width,
    height: fit.height,
    rotation: 0,
    flipX: false,
    flipY: false,
    keepAspect: true,
    fit: "contain",
    crop: null,
    srcWidth: opts.srcWidth,
    srcHeight: opts.srcHeight,
    dataUrl: opts.dataUrl,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    redSensitivity: project.dither.redSensitivity,
    ditherEnabled: true,
  };
}

export function createTextLayer(project: Project): TextLayer {
  const w = Math.min(160, project.canvasWidth);
  const h = 28;
  return {
    type: "text",
    id: newId(),
    name: nextLayerName(project.layers, "Text"),
    visible: true,
    locked: false,
    x: 8,
    y: 8,
    width: w,
    height: h,
    rotation: 0,
    text: "Text",
    color: "black",
    fill: { kind: "solid", color: "black" },
    fontSize: 16,
    bold: false,
    align: "left",
    lineHeight: 1.15,
    outline: false,
    outlineWidth: 1,
  };
}

export function createRectLayer(project: Project): RectLayer {
  return {
    type: "rect",
    id: newId(),
    name: nextLayerName(project.layers, "Obdélník"),
    visible: true,
    locked: false,
    x: 12,
    y: 12,
    width: 80,
    height: 40,
    rotation: 0,
    fill: { kind: "none" },
    stroke: { kind: "solid", color: "black" },
    strokeWidth: 2,
  };
}

export function createLineLayer(project: Project): LineLayer {
  return {
    type: "line",
    id: newId(),
    name: nextLayerName(project.layers, "Čára"),
    visible: true,
    locked: false,
    x1: 10,
    y1: 10,
    x2: Math.min(project.canvasWidth - 10, 120),
    y2: 10,
    color: "red",
    thickness: 2,
  };
}

export function fitContain(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): { x: number; y: number; width: number; height: number } {
  const s = Math.min(dstW / srcW, dstH / srcH);
  const width = srcW * s;
  const height = srcH * s;
  return { x: (dstW - width) / 2, y: (dstH - height) / 2, width, height };
}

export function fitCover(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): { x: number; y: number; width: number; height: number } {
  const s = Math.max(dstW / srcW, dstH / srcH);
  const width = srcW * s;
  const height = srcH * s;
  return { x: (dstW - width) / 2, y: (dstH - height) / 2, width, height };
}

export function duplicateLayer(layer: Layer): Layer {
  const copy = structuredClone(layer);
  copy.id = newId();
  copy.name = `${layer.name} kopie`;
  if (copy.type === "image" || copy.type === "text" || copy.type === "rect") {
    copy.x += 8;
    copy.y += 8;
  } else {
    copy.x1 += 8;
    copy.y1 += 8;
    copy.x2 += 8;
    copy.y2 += 8;
  }
  return copy;
}

export function reorderLayers(layers: Layer[], id: string, dir: -1 | 1): Layer[] {
  const i = layers.findIndex((l) => l.id === id);
  if (i < 0) return layers;
  const j = i + dir;
  if (j < 0 || j >= layers.length) return layers;
  const next = layers.slice();
  const [item] = next.splice(i, 1);
  next.splice(j, 0, item);
  return next;
}

export function findLayer(project: Project, id: string | null): Layer | null {
  if (!id) return null;
  return project.layers.find((l) => l.id === id) ?? null;
}

export function updateLayer(project: Project, id: string, patch: Partial<Layer>): Project {
  return {
    ...project,
    layers: project.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
  };
}
