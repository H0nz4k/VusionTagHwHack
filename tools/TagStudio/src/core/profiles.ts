import type { Orientation, ProfileId } from "./types";

export interface DisplayProfile {
  id: Exclude<ProfileId, "custom">;
  name: string;
  landscape: { width: number; height: number };
  portrait: { width: number; height: number };
  activeMm: { width: number; height: number };
}

export const PROFILES: Record<Exclude<ProfileId, "custom">, DisplayProfile> = {
  "EDG2-0260-A": {
    id: "EDG2-0260-A",
    name: "Vusion EDG2-0260-A",
    landscape: { width: 296, height: 152 },
    portrait: { width: 152, height: 296 },
    activeMm: { width: 60.1, height: 30.7 },
  },
  "EDG2-0420-B": {
    id: "EDG2-0420-B",
    name: "Vusion EDG2-0420-B",
    landscape: { width: 400, height: 300 },
    portrait: { width: 300, height: 400 },
    activeMm: { width: 84.8, height: 63.6 },
  },
};

export const PROFILE_LIST = Object.values(PROFILES);

export function canvasSizeFor(
  profileId: ProfileId,
  orientation: Orientation,
  customWidth?: number | null,
  customHeight?: number | null,
): { width: number; height: number } {
  if (profileId === "custom") {
    const width = Math.max(1, Math.floor(customWidth ?? 1));
    const height = Math.max(1, Math.floor(customHeight ?? 1));
    return { width, height };
  }
  const p = PROFILES[profileId];
  return orientation === "portrait" ? { ...p.portrait } : { ...p.landscape };
}

export function planeByteSize(width: number, height: number): number {
  return Math.ceil((width * height) / 8);
}

export function dualPlaneByteSize(width: number, height: number): number {
  return planeByteSize(width, height) * 2;
}

export function bitsNeedPadding(width: number, height: number): boolean {
  return (width * height) % 8 !== 0;
}

export function validateCustomSize(width: number, height: number): string | null {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return "Šířka i výška musí být kladná celá čísla.";
  }
  if (width < 1 || height < 1) {
    return "Šířka i výška musí být alespoň 1 px.";
  }
  if (width > 2048 || height > 2048) {
    return "Vlastní rozměr je omezen na 2048 px.";
  }
  return null;
}

export function profileLabel(profileId: ProfileId): string {
  if (profileId === "custom") return "Vlastní";
  return PROFILES[profileId].name;
}

export function physicalMm(
  profileId: ProfileId,
  orientation: Orientation,
): { width: number; height: number } | null {
  if (profileId === "custom") return null;
  const mm = PROFILES[profileId].activeMm;
  if (orientation === "portrait") return { width: mm.height, height: mm.width };
  return { ...mm };
}
