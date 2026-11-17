export const NEW_PAGE_REPORT_FILE_NAME = 'notes.md';

export function computeReportFileName(openFileName: string | null): string {
  const isNewPage = openFileName === null;
  if (isNewPage)
    return NEW_PAGE_REPORT_FILE_NAME;
  const extensionIndex = openFileName.lastIndexOf('.');
  const hasExtension = extensionIndex > 0;
  const baseName = hasExtension ? openFileName.slice(0, extensionIndex) : openFileName;
  return `${baseName}-notes.md`;
}
