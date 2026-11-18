import { h } from './renderHtml';

function renderPinBox(): JSX.Element {
  return (
    <div id="pinBox">
      <button id="pinButton">Pin</button>
      <button id="unpinButton">Unpin</button>
      <span id="pinInfo"></span>
    </div>
  );
}

function renderGraphButtonRow(): JSX.Element {
  return (
    <div id="graphButtonRow">
      <label id="replaceReferencesToggle"><input type="checkbox" id="replaceReferencesCheckbox" />{' replace references'}</label>
      <button id="collapseAllButton">Collapse all</button>
      <button id="expandAllButton">Expand all</button>
      <button id="jsonToggleButton" aria-label="show response" title="show response">{'{ }'}</button>
    </div>
  );
}

export function renderResultBox(): JSX.Element {
  return (
    <div id="resultBox">
      {renderPinBox()}
      <div id="winnerBox"></div>
      {renderGraphButtonRow()}
      <div id="graphContainerBox"></div>
      <div id="resultJsonEditor" hidden></div>
    </div>
  );
}
