export const AUTOSAVE_KEY = "tagstudio.autosave.v1";

export interface AutosaveRecord {
  savedAt: number;
  projectJson: string;
}

export function writeAutosave(projectJson: string): void {
  try {
    const rec: AutosaveRecord = { savedAt: Date.now(), projectJson };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(rec));
  } catch {
    /* kvóta / soukromý režim */
  }
}

export function readAutosave(): AutosaveRecord | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as AutosaveRecord;
    if (!rec?.projectJson) return null;
    return rec;
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    /* ignore */
  }
}
