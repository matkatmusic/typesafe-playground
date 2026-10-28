import { pageState } from './state';

export function notifyOnUnsavedClose(event: BeforeUnloadEvent): void {
  const isUnsaved = pageState.isDirty;
  if (isUnsaved)
    event.preventDefault();
}
