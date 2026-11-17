import type { PageData } from './types';
import { getElement } from './dom';

export function parsePageData(text: string): PageData {
  const data: PageData = JSON.parse(text);
  return data;
}

export function readPageData(): PageData {
  const dataText = getElement('data').textContent;
  if (dataText === null)
    throw new Error('data element has no text');
  return parsePageData(dataText);
}
