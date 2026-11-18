import { h } from './renderHtml';

function renderNoteBox(): JSX.Element {
  return (
    <div id="noteBox">
      <label for="noteText">Run comments:</label>
      <textarea id="noteText" rows={1} wrap="soft" disabled placeholder="Submit a run to add a note"></textarea>
    </div>
  );
}

export function renderVersionBox(): JSX.Element {
  return (
    <div id="versionBox">
      <button id="deleteVersionButton">Delete Version</button>
      <button id="prevVersionButton" aria-label="previous version">{'<'}</button>
      <span id="versionLabel"></span>
      <button id="nextVersionButton" aria-label="next version">{'>'}</button>
      <div id="versionNoteDivider"></div>
      {renderNoteBox()}
      <button id="resetRunsButton">Reset this version's runs</button>
    </div>
  );
}
