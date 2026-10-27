export function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null)
    throw new Error(`element ${id} is missing`);
  return element;
}

export function getInput(id: string): HTMLInputElement {
  const element = getElement(id);
  if (!(element instanceof HTMLInputElement))
    throw new Error(`element ${id} is not an input`);
  return element;
}

export function getDialog(id: string): HTMLDialogElement {
  const element = getElement(id);
  if (!(element instanceof HTMLDialogElement))
    throw new Error(`element ${id} is not a dialog`);
  return element;
}

export function getButton(id: string): HTMLButtonElement {
  const element = getElement(id);
  if (!(element instanceof HTMLButtonElement))
    throw new Error(`element ${id} is not a button`);
  return element;
}
