import { getButton } from './dom';
import { pageState } from './state';

export function formatTabTitle(fileName: string | null): string {
  return `Playground - ${fileName ?? 'Untitled'}`;
}

export function refreshFileView(): void {
  const handle = pageState.fileHandle;
  document.title = formatTabTitle(handle === null ? null : handle.name);
  getButton('resetButton').disabled = handle === null;
}
