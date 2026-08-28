import type { FsDirectoryHandle, FsFileHandle, FsPermission, FsWritable, HandleStore } from "./types";
import { FsNotAllowedError } from "./types";

export class MemoryFile implements FsFileHandle {
  data: Uint8Array = new Uint8Array();
  constructor(public name: string) {}
  async createWritable(): Promise<FsWritable> {
    const chunks: Uint8Array[] = [];
    return {
      write: async (data) => {
        if (typeof data === "string") chunks.push(new TextEncoder().encode(data));
        else chunks.push(data);
      },
      close: async () => {
        let len = 0;
        for (const c of chunks) len += c.byteLength;
        const out = new Uint8Array(len);
        let o = 0;
        for (const c of chunks) {
          out.set(c, o);
          o += c.byteLength;
        }
        this.data = out;
      },
    };
  }
  async readText(): Promise<string> {
    return new TextDecoder().decode(this.data);
  }
  async readBytes(): Promise<Uint8Array> {
    return this.data;
  }
}

export class MemoryDir implements FsDirectoryHandle {
  dirs = new Map<string, MemoryDir>();
  files = new Map<string, MemoryFile>();
  permission: FsPermission = "granted";
  constructor(public name: string) {}

  async getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<FsDirectoryHandle> {
    this.assertPerm();
    let d = this.dirs.get(name);
    if (!d) {
      if (!opts?.create) throw new Error(`Složka ${name} neexistuje.`);
      d = new MemoryDir(name);
      this.dirs.set(name, d);
    }
    return d;
  }

  async getFileHandle(name: string, opts?: { create?: boolean }): Promise<FsFileHandle> {
    this.assertPerm();
    let f = this.files.get(name);
    if (!f) {
      if (!opts?.create) throw new Error(`Soubor ${name} neexistuje.`);
      f = new MemoryFile(name);
      this.files.set(name, f);
    }
    return f;
  }

  async listNames(): Promise<string[]> {
    this.assertPerm();
    return [...this.dirs.keys(), ...this.files.keys()];
  }

  async queryPermission(): Promise<FsPermission> {
    return this.permission;
  }

  async requestPermission(): Promise<FsPermission> {
    if (this.permission === "denied") return "denied";
    this.permission = "granted";
    return this.permission;
  }

  private assertPerm(): void {
    if (this.permission !== "granted") throw new FsNotAllowedError();
  }
}

export class MemoryHandleStore implements HandleStore {
  root: FsDirectoryHandle | null = null;
  async saveRoot(handle: FsDirectoryHandle): Promise<void> {
    this.root = handle;
  }
  async loadRoot(): Promise<FsDirectoryHandle | null> {
    return this.root;
  }
  async clear(): Promise<void> {
    this.root = null;
  }
}
