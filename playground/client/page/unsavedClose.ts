import { pageState } from './state';

export function notifyOnUnsavedClose(event: BeforeUnloadEvent): void {
  const isUnsaved = pageState.isDirty;
  const isRunning = pageState.batchRun !== null;
  const isLeaveRisky = isUnsaved || isRunning;
  if (isLeaveRisky)
    event.preventDefault();
}
