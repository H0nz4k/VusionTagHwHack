import { zipSync } from "fflate";

export function zipProjectBundle(files: Record<string, Uint8Array>): Uint8Array {
  return zipSync(files, { level: 6 });
}

export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
