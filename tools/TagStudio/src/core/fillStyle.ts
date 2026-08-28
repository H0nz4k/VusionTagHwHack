import { INDEX_FROM_COLOR, type BwrPatternId, type FillStyle, type PaletteColor, type PaletteIndex } from "./types";
import { isBwrPatternId, sampleBwrPattern } from "./bwrPatterns";

export type { FillStyle };

export const NONE_FILL: FillStyle = { kind: "none" };
export const WHITE_FILL: FillStyle = { kind: "solid", color: "white" };
export const BLACK_FILL: FillStyle = { kind: "solid", color: "black" };
export const RED_FILL: FillStyle = { kind: "solid", color: "red" };

export function solidFill(color: PaletteColor): FillStyle {
  return { kind: "solid", color };
}

export function patternFill(patternId: BwrPatternId): FillStyle {
  return { kind: "bwr-pattern", patternId };
}

export function sampleFill(style: FillStyle, canvasX: number, canvasY: number): PaletteIndex | null {
  if (style.kind === "none") return null;
  if (style.kind === "solid") return INDEX_FROM_COLOR[style.color];
  return sampleBwrPattern(style.patternId, canvasX, canvasY);
}

export function isPatternFill(style: FillStyle): style is { kind: "bwr-pattern"; patternId: BwrPatternId } {
  return style.kind === "bwr-pattern";
}

export function parseFillStyle(value: unknown, fallback: FillStyle = NONE_FILL): FillStyle {
  if (value === "none" || value == null) return { kind: "none" };
  if (value === "white" || value === "black" || value === "red") return { kind: "solid", color: value };
  if (typeof value !== "object") return fallback;
  const obj = value as Record<string, unknown>;
  if (obj.kind === "none") return { kind: "none" };
  if (obj.kind === "solid" && (obj.color === "white" || obj.color === "black" || obj.color === "red")) {
    return { kind: "solid", color: obj.color };
  }
  if (obj.kind === "bwr-pattern" && typeof obj.patternId === "string" && isBwrPatternId(obj.patternId)) {
    return { kind: "bwr-pattern", patternId: obj.patternId };
  }
  return fallback;
}

export function fillLabel(style: FillStyle): string {
  if (style.kind === "none") return "žádná";
  if (style.kind === "solid") return style.color;
  return style.patternId;
}
