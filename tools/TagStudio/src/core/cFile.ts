import type { ExportSettings, IndexedBitmap, ProfileId } from "./types";
import { PALETTE_HEX } from "./types";
import { encodePlanes } from "./codec";
import { planeByteSize } from "./profiles";

const BYTES_PER_LINE = 16;

export interface CExportMeta {
  profileId: ProfileId;
  width: number;
  height: number;
  arrayName: string;
}

export function bytesFromCInitializer(source: string): Uint8Array {
  const matches = source.match(/0x[0-9a-fA-F]{1,2}/g);
  if (!matches) return new Uint8Array();
  const bytes = new Uint8Array(matches.length);
  for (let i = 0; i < matches.length; i++) bytes[i] = parseInt(matches[i], 16);
  return bytes;
}

export function declaredArraySize(source: string): number | null {
  const m = source.match(/gImage\s*\[\s*(\d+)\s*\]/);
  if (!m) return null;
  return Number(m[1]);
}

export function formatCFile(
  bytes: Uint8Array,
  meta: CExportMeta,
  settings: ExportSettings,
): string {
  const name = sanitizeCIdent(settings.cArrayName || meta.arrayName || "gImage");
  const plane = planeByteSize(
    settings.rotate === 90 || settings.rotate === 270 ? meta.height : meta.width,
    settings.rotate === 90 || settings.rotate === 270 ? meta.width : meta.height,
  );
  const lines: string[] = [];
  lines.push("/*");
  lines.push(" * TAG Studio export");
  lines.push(` * Profil: ${meta.profileId}`);
  lines.push(` * Rozlišení (plátno): ${meta.width} × ${meta.height} px`);
  lines.push(` * Velikost jedné roviny: ${plane} B`);
  lines.push(` * Celková velikost: ${bytes.length} B`);
  lines.push(` * Mapování: ${settings.planeMap === "cog-edg2-0260-a" ? "CoG 0x10/0x13 (W 0/0, B 1/0, R 0/1)" : "legacy bílá A=1 B=1, černá A=0 B=1, červená A=0 B=0"}`);
  lines.push(` * Pořadí bitů: ${settings.bitOrder}`);
  lines.push(` * Pořadí rovin: ${settings.planeOrder}`);
  lines.push(` * Inverze A: ${settings.invertA ? "ano" : "ne"}, inverze B: ${settings.invertB ? "ano" : "ne"}`);
  lines.push(` * Otočení: ${settings.rotate}°, flipX: ${settings.flipX}, flipY: ${settings.flipY}`);
  lines.push(` * Paleta: ${PALETTE_HEX.white} / ${PALETTE_HEX.black} / ${PALETTE_HEX.red}`);
  lines.push(" * Polarita a pořadí rovin na fyzickém tagu ještě nejsou OVĚŘENY.");
  lines.push(" */");
  const qual = settings.sdccCode ? "__code " : "";
  lines.push(`const unsigned char ${qual}${name}[] = {`);
  for (let i = 0; i < bytes.length; i += BYTES_PER_LINE) {
    const slice = bytes.subarray(i, Math.min(bytes.length, i + BYTES_PER_LINE));
    const hex = [...slice].map((b) => `0x${b.toString(16).padStart(2, "0")}`).join(", ");
    const comma = i + BYTES_PER_LINE < bytes.length ? "," : "";
    lines.push(`  ${hex}${comma}`);
  }
  lines.push("};");
  lines.push(`const unsigned int ${name}Size = sizeof(${name});`);
  lines.push("");
  return lines.join("\n");
}

export function sanitizeCIdent(name: string): string {
  let n = name.replace(/[^A-Za-z0-9_]/g, "_");
  if (!/^[A-Za-z_]/.test(n)) n = `_${n}`;
  return n || "gImage";
}

export function indexedToC(bitmap: IndexedBitmap, meta: CExportMeta, settings: ExportSettings): string {
  return formatCFile(encodePlanes(bitmap, settings), meta, settings);
}
