import type { BwPhaseId, DitherCategory, DitherId } from "./types";

export interface DitherAlgorithmInfo {
  id: DitherId;
  name: string;
  description: string;
  category: DitherCategory;
}

export const DITHER_ALGORITHMS: DitherAlgorithmInfo[] = [
  {
    id: "none",
    name: "Bez ditheringu",
    description: "Každý pixel na nejbližší barvu palety. Vhodné pro text, loga a plochou grafiku.",
    category: "basic",
  },
  {
    id: "floyd-steinberg",
    name: "Floyd–Steinberg",
    description: "Klasická error diffusion se serpentinovým průchodem.",
    category: "error-diffusion",
  },
  {
    id: "atkinson",
    name: "Atkinson",
    description: "Světlejší error diffusion, dobře čitelná na e-paperu.",
    category: "error-diffusion",
  },
  {
    id: "sierra-lite",
    name: "Sierra Lite",
    description: "Lehká error diffusion (2/4, 1/4, 1/4) se serpentinovým průchodem.",
    category: "error-diffusion",
  },
  {
    id: "burkes",
    name: "Burkes",
    description: "Širší kernel (jmenovatel 32). Univerzální volba pro fotografie.",
    category: "error-diffusion",
  },
  {
    id: "bayer-2x2",
    name: "Bayer 2×2",
    description: "Hrubý ordered rastr s výraznou mřížkou.",
    category: "ordered-noise",
  },
  {
    id: "ordered",
    name: "Bayer 4×4",
    description: "Stávající ordered dithering z v0.1.0. Stabilní ID: ordered.",
    category: "ordered-noise",
  },
  {
    id: "bayer-8x8",
    name: "Bayer 8×8",
    description: "Jemnější ordered rastr s více úrovněmi pokrytí.",
    category: "ordered-noise",
  },
  {
    id: "blue-noise",
    name: "Blue noise",
    description: "Prahování s deterministickou 64×64 dlaždicí bez pravidelné Bayerovy mřížky.",
    category: "ordered-noise",
  },
  {
    id: "bwr-two-phase",
    name: "BWR dvoufázový",
    description: "Nejprve rezervuje červené akcenty, zbytek převede jen na černou a bílou.",
    category: "bwr",
  },
];

export const CATEGORY_LABELS: Record<DitherCategory, string> = {
  basic: "Základní",
  "error-diffusion": "Error diffusion",
  "ordered-noise": "Ordered / Noise",
  bwr: "BWR dvoufázový",
};

export const BW_PHASE_IDS: BwPhaseId[] = [
  "none",
  "floyd-steinberg",
  "atkinson",
  "sierra-lite",
  "burkes",
  "bayer-2x2",
  "ordered",
  "bayer-8x8",
  "blue-noise",
];

const V1_MODES = new Set<string>(["none", "floyd-steinberg", "atkinson", "ordered"]);

export function isDitherId(value: string): value is DitherId {
  return DITHER_ALGORITHMS.some((a) => a.id === value);
}

export function isBwPhaseId(value: string): value is BwPhaseId {
  return (BW_PHASE_IDS as string[]).includes(value);
}

export function migrateV1DitherMode(mode: unknown): DitherId {
  if (typeof mode === "string" && V1_MODES.has(mode)) return mode as DitherId;
  if (typeof mode === "string" && isDitherId(mode)) return mode;
  return "floyd-steinberg";
}

export function getDitherInfo(id: DitherId): DitherAlgorithmInfo {
  return DITHER_ALGORITHMS.find((a) => a.id === id) ?? DITHER_ALGORITHMS[1];
}

export function algorithmsByCategory(): Array<{ category: DitherCategory; label: string; items: DitherAlgorithmInfo[] }> {
  const order: DitherCategory[] = ["basic", "error-diffusion", "ordered-noise", "bwr"];
  return order.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: DITHER_ALGORITHMS.filter((a) => a.category === category),
  }));
}
