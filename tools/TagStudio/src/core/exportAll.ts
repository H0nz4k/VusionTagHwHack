import { encodePlanes, decodePlanes, expectedBinSize } from "./codec";
import { encodeIndexedPng } from "./pngCodec";
import { formatCFile } from "./cFile";
import { exportStem } from "./folder";
import type { IndexedBitmap, Project } from "./types";

export function exportBin(bitmap: IndexedBitmap, project: Project): Uint8Array {
  return encodePlanes(bitmap, project.export);
}

export function exportC(bitmap: IndexedBitmap, project: Project): string {
  const bytes = exportBin(bitmap, project);
  return formatCFile(
    bytes,
    {
      profileId: project.profileId,
      width: project.canvasWidth,
      height: project.canvasHeight,
      arrayName: project.export.cArrayName,
    },
    project.export,
  );
}

export function exportPng(bitmap: IndexedBitmap): Uint8Array {
  return encodeIndexedPng(bitmap);
}

export function diagnosticDecode(bitmap: IndexedBitmap, project: Project) {
  const bytes = exportBin(bitmap, project);
  const decoded = decodePlanes(bytes, project.canvasWidth, project.canvasHeight, project.export);
  return { bytes, ...decoded, expectedBytes: expectedBinSize(project.canvasWidth, project.canvasHeight, project.export.rotate) };
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadBytes(filename: string, bytes: Uint8Array, mime: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  downloadBlob(filename, new Blob([copy], { type: mime }));
}

export function downloadText(filename: string, text: string, mime: string): void {
  downloadBlob(filename, new Blob([text], { type: mime }));
}

export function defaultExportStem(project: Project): string {
  return exportStem(project.profileId, project.canvasWidth, project.canvasHeight);
}
