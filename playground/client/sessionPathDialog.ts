import { getDialog, getInput } from './dom';
import { readPageData } from './pageData';

export function openSessionPathDialog(): void {
  const field = getInput('sessionPathField');
  field.value = readPageData().historyPath;
  getDialog('sessionPathDialog').showModal();
  field.select();
}

export function closeSessionPathDialog(): void {
  getDialog('sessionPathDialog').close();
}

export async function copySessionPath(): Promise<void> {
  await navigator.clipboard.writeText(getInput('sessionPathField').value);
}
