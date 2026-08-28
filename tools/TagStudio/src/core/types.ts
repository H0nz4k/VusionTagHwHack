export const APP_NAME = "TAG Studio";
export const APP_VERSION = "0.3.0";
export const APP_CREDIT = "HanzG";
export const SCHEMA_VERSION = 3 as const;
export const SCHEMA_VERSION_V1 = 1 as const;
export const SCHEMA_VERSION_V2 = 2 as const;

export const WHITE = 0 as const;
export const BLACK = 1 as const;
export const RED = 2 as const;
export const INVALID = 3 as const;

export type PaletteIndex = 0 | 1 | 2;
export type DecodedIndex = 0 | 1 | 2 | 3;
export type PaletteColor = "white" | "black" | "red";
export type FillColor = PaletteColor | "none";
export type PlaneMap = "legacy" | "cog-edg2-0260-a";

export type BwrPatternId =
  | "bwr-01-white"
  | "bwr-02-black"
  | "bwr-03-red"
  | "bwr-04-gray-25"
  | "bwr-05-gray-50"
  | "bwr-06-gray-75"
  | "bwr-07-pink-25"
  | "bwr-08-red-50"
  | "bwr-09-red-75"
  | "bwr-10-darkred-25"
  | "bwr-11-redblack-50"
  | "bwr-12-red-black-25"
  | "bwr-13-rgb-33"
  | "bwr-14-w50-b25-r25"
  | "bwr-15-w25-b50-r25"
  | "bwr-16-red50";

export type FillStyle =
  | { kind: "none" }
  | { kind: "solid"; color: PaletteColor }
  | { kind: "bwr-pattern"; patternId: BwrPatternId };

export type DitherId =
  | "none"
  | "floyd-steinberg"
  | "atkinson"
  | "sierra-lite"
  | "burkes"
  | "ordered"
  | "bayer-2x2"
  | "bayer-8x8"
  | "blue-noise"
  | "bwr-two-phase";

/** @deprecated Použij DitherId. Alias kvůli v0.1. */
export type DitherMode = DitherId;

export type BwPhaseId = Exclude<DitherId, "bwr-two-phase">;
export type DitherCategory = "basic" | "error-diffusion" | "ordered-noise" | "bwr";
export type ImageFit = "contain" | "cover" | "manual";
export type BitOrder = "msb-first" | "lsb-first";
export type PlaneOrder = "a-then-b" | "b-then-a";
export type RotationQ = 0 | 90 | 180 | 270;
export type Orientation = "landscape" | "portrait";
export type ProfileId = "EDG2-0260-A" | "EDG2-0420-B" | "custom";
export type TextAlign = "left" | "center" | "right";
export type LayerType = "image" | "text" | "rect" | "line";

export const PALETTE_RGB: Record<PaletteIndex, readonly [number, number, number]> = {
  [WHITE]: [255, 255, 255],
  [BLACK]: [0, 0, 0],
  [RED]: [255, 0, 0],
};

export const PALETTE_HEX: Record<PaletteColor, string> = {
  white: "#FFFFFF",
  black: "#000000",
  red: "#FF0000",
};

export const INDEX_FROM_COLOR: Record<PaletteColor, PaletteIndex> = {
  white: WHITE,
  black: BLACK,
  red: RED,
};

export const COLOR_FROM_INDEX: Record<PaletteIndex, PaletteColor> = {
  [WHITE]: "white",
  [BLACK]: "black",
  [RED]: "red",
};

export const INVALID_RGB: readonly [number, number, number] = [255, 0, 255];

export interface ExportSettings {
  bitOrder: BitOrder;
  planeOrder: PlaneOrder;
  invertA: boolean;
  invertB: boolean;
  rotate: RotationQ;
  flipX: boolean;
  flipY: boolean;
  cArrayName: string;
  sdccCode: boolean;
  /** legacy = v0.1/v0.2 A/B mapování. cog-edg2-0260-a = ověřené CoG 0x10/0x13. */
  planeMap: PlaneMap;
}

export interface BwrSettings {
  minChroma: number;
  maskThreshold: number;
  protectNeutrals: boolean;
  bwPhase: BwPhaseId;
}

export interface DitherSettings {
  mode: DitherId;
  brightness: number;
  contrast: number;
  saturation: number;
  redSensitivity: number;
  blueNoiseStrength: number;
  bwr: BwrSettings;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayerBase {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface ImageLayer extends LayerBase {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  keepAspect: boolean;
  fit: ImageFit;
  crop: CropRect | null;
  srcWidth: number;
  srcHeight: number;
  dataUrl: string;
  brightness: number;
  contrast: number;
  saturation: number;
  redSensitivity: number;
  ditherEnabled: boolean;
}

export interface TextLayer extends LayerBase {
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text: string;
  color: PaletteColor;
  fill: FillStyle;
  fontSize: number;
  bold: boolean;
  align: TextAlign;
  lineHeight: number;
  outline: boolean;
  outlineWidth: number;
}

export interface RectLayer extends LayerBase {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: FillStyle;
  stroke: FillStyle;
  strokeWidth: number;
}

export interface LineLayer extends LayerBase {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: PaletteColor;
  thickness: number;
}

export type Layer = ImageLayer | TextLayer | RectLayer | LineLayer;

export interface Project {
  schemaVersion: typeof SCHEMA_VERSION;
  projectId: string;
  createdAt: string;
  modifiedAt: string;
  folderName: string;
  profileId: ProfileId;
  customWidth: number | null;
  customHeight: number | null;
  orientation: Orientation;
  canvasWidth: number;
  canvasHeight: number;
  layers: Layer[];
  dither: DitherSettings;
  background: FillStyle;
  safeMargin: number;
  showSafeMargin: boolean;
  showPixelGrid: boolean;
  export: ExportSettings;
}

export interface IndexedBitmap {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export interface RgbaBitmap {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface RgbBitmap {
  width: number;
  height: number;
  data: Uint8Array;
}

export function defaultExportSettings(): ExportSettings {
  return {
    bitOrder: "msb-first",
    planeOrder: "a-then-b",
    invertA: false,
    invertB: false,
    rotate: 0,
    flipX: false,
    flipY: false,
    cArrayName: "gImage",
    sdccCode: false,
    planeMap: "legacy",
  };
}

export function defaultBwrSettings(): BwrSettings {
  return {
    minChroma: 18,
    maskThreshold: 48,
    protectNeutrals: true,
    bwPhase: "atkinson",
  };
}

export function defaultDitherSettings(): DitherSettings {
  return {
    mode: "floyd-steinberg",
    brightness: 0,
    contrast: 0,
    saturation: 0,
    redSensitivity: 45,
    blueNoiseStrength: 50,
    bwr: defaultBwrSettings(),
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}
