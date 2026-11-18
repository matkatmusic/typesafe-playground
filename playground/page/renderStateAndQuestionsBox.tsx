import { h } from './renderHtml';

function renderStateEditor(): JSX.Element {
  return (
    <div id="stateJsonEditor">
      <div id="stateTitleRow">
        <span class="other-label">state</span>
        <label id="batchToggle"><input type="checkbox" id="batchCheckbox" />{' batch'}</label>
        <button class="format-json-button" id="stateUndoButton">Undo</button>
        <button class="format-json-button" id="stateRedoButton">Redo</button>
        <button class="format-json-button" id="stateFormatJsonButton">Format JSON</button>
      </div>
    </div>
  );
}

function renderQuestionsEditor(): JSX.Element {
  return (
    <div id="questionsJsonEditor">
      <div id="questionsTitleRow">
        <span class="other-label">questions</span>
        <div id="questionsAddQuestion"></div>
        <button class="format-json-button" id="questionsUndoButton">Undo</button>
        <button class="format-json-button" id="questionsRedoButton">Redo</button>
        <button class="format-json-button" id="questionsFormatJsonButton">Format JSON</button>
      </div>
    </div>
  );
}

export function renderStateAndQuestionsBox(): JSX.Element {
  return (
    <div id="stateAndQuestionsBox">
      {renderStateEditor()}
      <div class="row-resizer" id="rowResizer"></div>
      {renderQuestionsEditor()}
    </div>
  );
}
