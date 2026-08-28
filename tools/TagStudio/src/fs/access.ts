import type { FsDirectoryHandle, FsFileHandle, FsPermission, FsWritable, HandleStore } from "./types";
import { FsAbortError, FsNotAllowedError } from "./types";

interface NativeDir {
  name: string;
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<NativeDir>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<NativeFile>;
  values(): AsyncIterable<{ kind: string; name: string }>;
  queryPermission?(opts: { mode: "readwrite" }): Promise<FsPermission>;
  requestPermission?(opts: { mode: "readwrite" }): Promise<FsPermission>;
}

interface NativeFile {
  name: string;
  createWritable(): Promise<{ write(data: BufferSource | Blob | string): Promise<void>; close(): Promise<void> }>;
  getFile(): Promise<File>;
}

class NativeFileAdapter implements FsFileHandle {
  constructor(private inner: NativeFile, public name: string) {}
  async createWritable(): Promise<FsWritable> {
    const w = await this.inner.createWritable();
    return {
      write: async (data) => {
        if (typeof data === "string") await w.write(data);
        else {
          const copy = new Uint8Array(data.byteLength);
          copy.set(data);
          await w.write(copy);
        }
      },
      close: () => w.close(),
    };
  }
  async readText(): Promise<string> {
    const f = await this.inner.getFile();
    return f.text();
  }
  async readBytes(): Promise<Uint8Array> {
    const f = await this.inner.getFile();
    return new Uint8Array(await f.arrayBuffer());
  }
}

export class NativeDirAdapter implements FsDirectoryHandle {
  constructor(private inner: NativeDir, public name: string) {}

  async getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<FsDirectoryHandle> {
    const d = await this.inner.getDirectoryHandle(name, opts);
    return new NativeDirAdapter(d, d.name);
  }

  async getFileHandle(name: string, opts?: { create?: boolean }): Promise<FsFileHandle> {
    const f = await this.inner.getFileHandle(name, opts);
    return new NativeFileAdapter(f, f.name);
  }

  async listNames(): Promise<string[]> {
    const names: string[] = [];
    for await (const entry of this.inner.values()) names.push(entry.name);
    return names;
  }

  async queryPermission(): Promise<FsPermission> {
    if (!this.inner.queryPermission) return "granted";
    return this.inner.queryPermission({ mode: "readwrite" });
  }

  async requestPermission(): Promise<FsPermission> {
    if (!this.inner.requestPermission) return "granted";
    return this.inner.requestPermission({ mode: "readwrite" });
  }

  unwrap(): NativeDir {
    return this.inner;
  }
}

interface FsPickerGlobal {
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<NativeDir>;
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: Array<{ description?: string; accept: Record<string, string[]> }>;
  }) => Promise<Array<{ getFile(): Promise<File> }>>;
}

function pickerGlobal(): FsPickerGlobal {
  return globalThis as unknown as FsPickerGlobal;
}

export function isFsAccessAvailable(): boolean {
  return typeof pickerGlobal().showDirectoryPicker === "function";
}

export async function pickRootDirectory(): Promise<FsDirectoryHandle> {
  const g = pickerGlobal();
  if (typeof g.showDirectoryPicker !== "function") throw new Error("File System Access API není dostupné.");
  try {
    const handle = await g.showDirectoryPicker({ mode: "readwrite" });
    return new NativeDirAdapter(handle, handle.name);
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError") throw new FsAbortError();
    if (name === "NotAllowedError" || name === "SecurityError") throw new FsNotAllowedError();
    throw e;
  }
}

export async function pickProjectJsonFile(): Promise<{ name: string; text: string } | null> {
  const g = pickerGlobal();
  if (typeof g.showOpenFilePicker !== "function") return null;
  try {
    const [handle] = await g.showOpenFilePicker({
      multiple: false,
      types: [{ description: "TAG Studio projekt", accept: { "application/json": [".json"] } }],
    });
    const file = await handle.getFile();
    return { name: file.name, text: await file.text() };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError") return null;
    throw e;
  }
}

const DB_NAME = "tagstudio-fs-v2";
const STORE = "handles";
const ROOT_KEY = "workspaceRoot";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class IdbHandleStore implements HandleStore {
  async saveRoot(handle: FsDirectoryHandle): Promise<void> {
    if (!(handle instanceof NativeDirAdapter)) return;
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(handle.unwrap(), ROOT_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      /* handle nemusí být strukturovaně klonovatelný (mock / starý prohlížeč) */
    }
  }

  async loadRoot(): Promise<FsDirectoryHandle | null> {
    if (typeof indexedDB === "undefined") return null;
    try {
      const db = await openDb();
      const native = await new Promise<NativeDir | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(ROOT_KEY);
        req.onsuccess = () => resolve(req.result as NativeDir | undefined);
        req.onerror = () => reject(req.error);
      });
      db.close();
      if (!native) return null;
      return new NativeDirAdapter(native, native.name);
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(ROOT_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      /* ignore */
    }
  }
}
