/// <reference types="vite/client" />

interface DirectoryPickerOptions {
  mode?: "read" | "readwrite";
}

interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}

interface Window {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
  __TAGSTUDIO_E2E__?: {
    disableFs?: boolean;
    permission?: PermissionState;
    abortPicker?: boolean;
    dump?: () => string[];
  };
}
