export type Clock = () => Date;

export const defaultClock: Clock = () => new Date();

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Místní čas, bez dvojteček a znaků neplatných ve Windows. */
export function formatProjectFolderName(date: Date): string {
  return `TAG_Project_${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_${pad2(date.getHours())}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}`;
}

const WIN_ILLEGAL = new Set('<>:"/\\|?*');

export function sanitizeFileName(name: string): string {
  let n = "";
  for (const ch of name) {
    const code = ch.charCodeAt(0);
    n += code < 32 || WIN_ILLEGAL.has(ch) ? "_" : ch;
  }
  n = n.replace(/^\.+$/, "_").trim();
  if (n === "." || n === "..") n = "_";
  if (n.includes("..")) n = n.replaceAll("..", "_");
  if (!n) n = "soubor";
  return n.slice(0, 120);
}

export function uniqueName(desired: string, existing: Iterable<string>, suffixPad = 2): string {
  const set = new Set(existing);
  if (!set.has(desired)) return desired;
  let n = 2;
  while (n < 1000) {
    const candidate = `${desired}_${n.toString().padStart(suffixPad, "0")}`;
    if (!set.has(candidate)) return candidate;
    n += 1;
  }
  return `${desired}_${Date.now()}`;
}

export function versionedFileName(filename: string, existing: Iterable<string>): string {
  const set = new Set(existing);
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : "";
  let n = 2;
  while (n < 1000) {
    const candidate = `${stem}_v${n.toString().padStart(2, "0")}${ext}`;
    if (!set.has(candidate)) return candidate;
    n += 1;
  }
  return `${stem}_v${Date.now()}${ext}`;
}

export function exportStem(profileId: string, width: number, height: number): string {
  return sanitizeFileName(`tagstudio_${profileId}_${width}x${height}`);
}
