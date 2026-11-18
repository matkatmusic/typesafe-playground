import { test, expect } from 'bun:test'
import { renderNotesDialog, renderReportDialog, renderSessionPathDialog, renderUnsavedDialog } from './renderDialogs'

function validateUnsavedDialogMarkup() {
    expect(renderUnsavedDialog().toString()).toBe(
        '<dialog id="unsavedDialog"><form method="dialog"><p>Save your changes first?</p>'
        + '<div id="unsavedDialogButtons"><button value="save">Save</button><button value="discard">Don&#39;t Save</button><button value="cancel">Cancel</button></div>'
        + '</form></dialog>',
    )
}

function validateNotesDialogMarkup() {
    expect(renderNotesDialog().toString()).toBe(
        '<dialog id="notesDialog"><form method="dialog"><p id="notesDialogTitle"></p>'
        + '<textarea id="notesDialogText" rows="8" aria-label="notes"></textarea>'
        + '<div id="notesDialogButtons"><button value="cancel">Cancel</button><button value="ok">OK</button></div>'
        + '</form></dialog>',
    )
}

function validateSessionPathDialogMarkup() {
    expect(renderSessionPathDialog().toString()).toBe(
        '<dialog id="sessionPathDialog"><form method="dialog"><label for="sessionPathField">Session file</label>'
        + '<input id="sessionPathField" type="text" readonly>'
        + '<div id="sessionPathDialogButtons"><button type="button" id="sessionPathCopyButton">Copy</button><button type="button" id="sessionPathCloseButton">Close</button></div>'
        + '</form></dialog>',
    )
}

function validateReportDialogMarkup() {
    expect(renderReportDialog().toString()).toBe(
        '<dialog id="reportDialog"><div id="reportDialogHeader"><span id="reportDialogTitle">Report</span>'
        + '<button id="reportCopyButton">Copy</button><button id="reportDownloadButton">Download .md</button>'
        + '<button id="reportCloseButton" aria-label="close report">×</button></div>'
        + '<div id="reportBody"></div></dialog>',
    )
}

test('test_unsaved_dialog_markup', validateUnsavedDialogMarkup)
test('test_notes_dialog_markup', validateNotesDialogMarkup)
test('test_session_path_dialog_markup', validateSessionPathDialogMarkup)
test('test_report_dialog_markup', validateReportDialogMarkup)
