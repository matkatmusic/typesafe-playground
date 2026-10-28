import type { RunOutput, Version } from '../playgroundHistory';

export type ThemeName = 'dark' | 'light';
export type UnsavedStep = 'save' | 'continue' | 'stop';

// export type PageData = { versions: Version[]; draft: { state: string; questions: string } | null; hasEnvKey: boolean };
export type PageData = { versions: Version[]; hasEnvKey: boolean };

export type PageState = { versions: Version[]; index: number; fileHandle: FileSystemFileHandle | null; isDirty: boolean; pinnedId: number | null };

export type RunBody = { id: number; calls: number; apiKey: string; state: unknown; questions: unknown };

export type RunResult = { outputs: RunOutput[]; version: Version };

// Minimal File System Access API members (Chromium only)
declare global {
  interface FilePickerAcceptType {
    description?: string;
    accept: Record<string, string[]>;
  }

  interface FilePickerOptions {
    types?: FilePickerAcceptType[];
    suggestedName?: string;
  }

  interface FileSystemWritableFileStream {
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }

  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface Window {
    showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle>;
  }
}
