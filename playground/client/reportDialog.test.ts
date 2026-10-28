import { test, expect, afterEach, spyOn } from 'bun:test';
import { closeReportDialog, copyReport, openReportDialog, saveReportFile } from './reportDialog';
import { pageState } from './state';

class FakeDialog {
  isOpen = false
  showModal() {
    this.isOpen = true
  }
  close() {
    this.isOpen = false
  }
}

function installFakeDom() {
  const dialog = new FakeDialog()
  const body = { innerHTML: '' }
  const link = { href: '', download: '', clickCount: 0, click() { this.clickCount++ } }
  const elements: Record<string, unknown> = { reportDialog: dialog, reportBody: body }
  Object.assign(globalThis, { HTMLDialogElement: FakeDialog, document: { getElementById: (id: string) => elements[id] ?? null, createElement: () => link } })
  return { dialog, body, link }
}

function removeFakeDom() {
  Reflect.deleteProperty(globalThis, 'document')
  Reflect.deleteProperty(globalThis, 'HTMLDialogElement')
  pageState.versions = []
  pageState.fileHandle = null
}

afterEach(removeFakeDom)

function validateOpenFillsTheBodyAndShowsTheDialog() {
  const { dialog, body } = installFakeDom()
  pageState.versions = [{ id: 1, time: 't1', state: {}, questions: {}, calls: 0, outputs: [], note: 'hello <b>' }]
  openReportDialog()
  expect(dialog.isOpen).toBe(true)
  expect(body.innerHTML).toContain('<h2>Version 1 (t1)</h2>')
  expect(body.innerHTML).toContain('hello &lt;b&gt;')
}

function validateCloseHidesTheDialog() {
  const { dialog } = installFakeDom()
  openReportDialog()
  closeReportDialog()
  expect(dialog.isOpen).toBe(false)
}

async function validateCopyWritesTheMarkdownToTheClipboard() {
  const written: string[] = []
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  async function writeText(text: string) {
    written.push(text)
  }
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText } }, configurable: true })
  pageState.versions = [{ id: 1, time: 't1', state: {}, questions: {}, calls: 0, outputs: [], note: 'kept' }]
  await copyReport()
  expect(written).toEqual(['# Notes report\n\n## Version 1 (t1)\n\n### Run comments\n\nkept\n'])
  if (original !== undefined)
    Object.defineProperty(globalThis, 'navigator', original)
}

async function validateSaveClicksADownloadLinkNamedAfterTheOpenFile() {
  const { link } = installFakeDom()
  pageState.fileHandle = { name: 'my run.json' } as FileSystemFileHandle
  const createUrl = spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
  const revokeUrl = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  saveReportFile()
  expect(link.href).toBe('blob:fake')
  expect(link.download).toBe('my run-notes.md')
  expect(link.clickCount).toBe(1)
  expect(revokeUrl).toHaveBeenCalledWith('blob:fake')
  const blob = createUrl.mock.calls[0][0] as Blob
  expect(await blob.text()).toBe('# Notes report\n\nNo notes yet.\n')
  createUrl.mockRestore()
  revokeUrl.mockRestore()
}

test('test_open_fills_the_body_and_shows_the_dialog', validateOpenFillsTheBodyAndShowsTheDialog)
test('test_close_hides_the_dialog', validateCloseHidesTheDialog)
test('test_copy_writes_the_markdown_to_the_clipboard', validateCopyWritesTheMarkdownToTheClipboard)
test('test_save_clicks_a_download_link_named_after_the_open_file', validateSaveClicksADownloadLinkNamedAfterTheOpenFile)
