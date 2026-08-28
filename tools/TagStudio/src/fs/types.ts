export type FsPermission = "granted" | "denied" | "prompt";

export interface FsWritable {
  write(data: Uint8Array | string): Promise<void>;
  close(): Promise<void>;
}

export interface FsFileHandle {
  readonly name: string;
  createWritable(): Promise<FsWritable>;
  readText?(): Promise<string>;
  readBytes?(): Promise<Uint8Array>;
}

export interface FsDirectoryHandle {
  readonly name: string;
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<FsDirectoryHandle>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FsFileHandle>;
  listNames(): Promise<string[]>;
  queryPermission(): Promise<FsPermission>;
  requestPermission(): Promise<FsPermission>;
}

export class FsAbortError extends Error {
  constructor(message = "Výběr byl zrušen.") {
    super(message);
    this.name = "AbortError";
  }
}

export class FsNotAllowedError extends Error {
  constructor(message = "Přístup ke složce byl zamítnut.") {
    super(message);
    this.name = "NotAllowedError";
  }
}

export class FsWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FsWriteError";
  }
}

export interface HandleStore {
  saveRoot(handle: FsDirectoryHandle): Promise<void>;
  loadRoot(): Promise<FsDirectoryHandle | null>;
  clear(): Promise<void>;
}

export async function writeFileAtomic(dir: FsDirectoryHandle, name: string, data: Uint8Array | string): Promise<void> {
  const file = await dir.getFileHandle(name, { create: true });
  const w = await file.createWritable();
  try {
    await w.write(data);
  } catch (e) {
    try {
      await w.close();
    } catch {
      /* ignore */
    }
    throw new FsWriteError(e instanceof Error ? e.message : "Zápis souboru selhal.");
  }
  await w.close();
}

export async function fileExists(dir: FsDirectoryHandle, name: string): Promise<boolean> {
  const names = await dir.listNames();
  return names.includes(name);
}
