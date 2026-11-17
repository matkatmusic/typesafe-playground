import type { UnsavedStep } from './types';
import { getDialog } from './dom';

export function computeUnsavedStep(choice: string): UnsavedStep {
  if (choice === 'save')
    return 'save';
  if (choice === 'discard')
    return 'continue';
  if (choice === 'cancel')
    return 'stop';
  throw new Error(`unknown unsaved choice ${choice}`);
}

export function readUnsavedChoice(): Promise<string> {
  const dialog = getDialog('unsavedDialog');
  dialog.returnValue = 'cancel';
  function waitForClose(resolve: (choice: string) => void): void {
    function emitChoice(): void {
      resolve(dialog.returnValue);
    }
    dialog.addEventListener('close', emitChoice, { once: true });
  }
  dialog.showModal();
  return new Promise(waitForClose);
}
