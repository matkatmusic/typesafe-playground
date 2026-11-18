export function computeReportFileName(openFileName: string | null): string {
    const newPageReportFileName = 'notes.md';
    const isNewPage = openFileName === null;
    if (isNewPage)
        return newPageReportFileName;
    const extensionIndex = openFileName.lastIndexOf('.');
    const hasExtension = extensionIndex > 0;
    const baseName = hasExtension ? openFileName.slice(0, extensionIndex) : openFileName;
    return `${baseName}-notes.md`;
}
