import { Fragment, h } from './renderHtml';

export function renderUnsavedDialog(): JSX.Element {
  return (
    <dialog id="unsavedDialog">
      <form method="dialog">
        <p>Save your changes first?</p>
        <div id="unsavedDialogButtons">
          <button value="save">Save</button>
          <button value="discard">Don't Save</button>
          <button value="cancel">Cancel</button>
        </div>
      </form>
    </dialog>
  );
}

export function renderNotesDialog(): JSX.Element {
  return (
    <dialog id="notesDialog">
      <form method="dialog">
        <p id="notesDialogTitle"></p>
        <textarea id="notesDialogText" rows={8} aria-label="notes"></textarea>
        <div id="notesDialogButtons">
          <button value="cancel">Cancel</button>
          <button value="ok">OK</button>
        </div>
      </form>
    </dialog>
  );
}

export function renderSessionPathDialog(): JSX.Element {
  return (
    <dialog id="sessionPathDialog">
      <form method="dialog">
        <label for="sessionPathField">Session file</label>
        <input id="sessionPathField" type="text" readonly />
        <div id="sessionPathDialogButtons">
          <button type="button" id="sessionPathCopyButton">Copy</button>
          <button type="button" id="sessionPathCloseButton">Close</button>
        </div>
      </form>
    </dialog>
  );
}

export function renderReportDialog(): JSX.Element {
  return (
    <dialog id="reportDialog">
      <div id="reportDialogHeader">
        <span id="reportDialogTitle">Report</span>
        <button id="reportCopyButton">Copy</button>
        <button id="reportDownloadButton">Download .md</button>
        <button id="reportCloseButton" aria-label="close report">{'×'}</button>
      </div>
      <div id="reportBody"></div>
    </dialog>
  );
}

export function renderDialogs(): JSX.Element {
  return (
    <>
      {renderUnsavedDialog()}
      {renderNotesDialog()}
      {renderSessionPathDialog()}
      {renderReportDialog()}
    </>
  );
}
