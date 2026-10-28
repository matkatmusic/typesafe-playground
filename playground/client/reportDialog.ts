import { getDialog, getElement } from './dom';
import { computeReportFileName } from './reportFileName';
import { renderReportHtml } from './reportHtml';
import { buildReportMarkdown } from './reportMarkdown';
import { pageState } from './state';

export function openReportDialog(): void {
  getElement('reportBody').innerHTML = renderReportHtml(buildReportMarkdown(pageState.versions));
  getDialog('reportDialog').showModal();
}

export function closeReportDialog(): void {
  getDialog('reportDialog').close();
}

export async function copyReport(): Promise<void> {
  await navigator.clipboard.writeText(buildReportMarkdown(pageState.versions));
}

export function saveReportFile(): void {
  const handle = pageState.fileHandle;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([buildReportMarkdown(pageState.versions)], { type: 'text/markdown' }));
  link.download = computeReportFileName(handle === null ? null : handle.name);
  link.click();
  URL.revokeObjectURL(link.href);
}
