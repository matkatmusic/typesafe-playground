import type { Provider, RunOutput, Version } from '../../history/playgroundHistory';

export type ThemeName = 'dark' | 'light';
export type UnsavedStep = 'save' | 'continue' | 'stop';

export interface PageData { versions: Version[]; historyPath: string; hasEnvKey: boolean; hasSubqEnvKey: boolean }

export interface EditedDraft { state: string; questions: string; baseIndex: number }

export interface PendingNotes { state: string | null; questions: string | null }

export interface BatchRun { item: number; count: number }
export interface PageState { versions: Version[]; index: number; fileHandle: FileSystemFileHandle | null; isDirty: boolean; pinnedIndex: number | null; editedDraft: EditedDraft | null; pendingNotes: PendingNotes; isBatchOn: boolean; batchRun: BatchRun | null }

export interface RunBody { index: number; calls: number; apiKey: string; provider: Provider; state: unknown; questions: unknown }

export interface RunResult { outputs: RunOutput[]; version: Version; index: number }

// Minimal File System Access API members (Chromium only)
// eslint-disable-next-line no-restricted-syntax
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
