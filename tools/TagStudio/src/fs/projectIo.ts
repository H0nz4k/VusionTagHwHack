import { defaultExportStem } from "../core/exportAll";
import { serializeProject } from "../core/project";
import { exportBin, exportC, exportPng } from "../core/exportAll";
import type { IndexedBitmap, Project } from "../core/types";
import { textToBytes, zipProjectBundle } from "./zip";
import { fileExists, writeFileAtomic, type FsDirectoryHandle } from "./types";
import { versionedFileName } from "../core/folder";

export type ConflictChoice = "overwrite" | "version" | "cancel";

export interface ProjectFiles {
  jsonName: string;
  pngName: string;
  binName: string;
  cName: string;
  json: string;
  png: Uint8Array;
  bin: Uint8Array;
  c: string;
}

export function buildProjectFiles(project: Project, bitmap: IndexedBitmap): ProjectFiles {
  const stem = defaultExportStem(project);
  return {
    jsonName: "project.tagstudio.json",
    pngName: `${stem}.png`,
    binName: `${stem}.bin`,
    cName: `${stem}.c`,
    json: serializeProject(project),
    png: exportPng(bitmap),
    bin: exportBin(bitmap, project),
    c: exportC(bitmap, project),
  };
}

export async function writeNamed(
  dir: FsDirectoryHandle,
  name: string,
  data: Uint8Array | string,
  existing: string[],
  conflict: ConflictChoice,
): Promise<{ name: string; ok: boolean; error?: string }> {
  let target = name;
  if (existing.includes(name)) {
    if (conflict === "cancel") return { name, ok: false, error: "zrušeno" };
    if (conflict === "version") target = versionedFileName(name, existing);
  }
  try {
    await writeFileAtomic(dir, target, data);
    return { name: target, ok: true };
  } catch (e) {
    return { name: target, ok: false, error: e instanceof Error ? e.message : "zápis selhal" };
  }
}

export async function writeAllToDir(
  dir: FsDirectoryHandle,
  files: ProjectFiles,
  conflict: ConflictChoice,
): Promise<Array<{ name: string; ok: boolean; error?: string }>> {
  const existing = await dir.listNames();
  const results = [];
  results.push(await writeNamed(dir, files.jsonName, files.json, existing, conflict));
  existing.push(results[0].name);
  results.push(await writeNamed(dir, files.pngName, files.png, existing, conflict));
  existing.push(results[1].name);
  results.push(await writeNamed(dir, files.binName, files.bin, existing, conflict));
  existing.push(results[2].name);
  results.push(await writeNamed(dir, files.cName, files.c, existing, conflict));
  return results;
}

export function zipAll(folderName: string, files: ProjectFiles): { filename: string; bytes: Uint8Array } {
  const bytes = zipProjectBundle({
    [`${folderName}/${files.jsonName}`]: textToBytes(files.json),
    [`${folderName}/${files.pngName}`]: files.png,
    [`${folderName}/${files.binName}`]: files.bin,
    [`${folderName}/${files.cName}`]: textToBytes(files.c),
  });
  return { filename: `${folderName}.zip`, bytes };
}

export { fileExists };
