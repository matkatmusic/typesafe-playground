import { Fragment, h } from './renderHtml';

function renderFileButtons(): JSX.Element {
  return (
    <>
      <button id="newButton">New</button>
      <button id="openButton">Open</button>
      <button id="saveButton">Save</button>
      <button id="resetButton">Reset</button>
      <button id="reportButton">Report</button>
      <button id="copyPathButton">copy path</button>
    </>
  );
}

export function renderProviderSwitch(): JSX.Element {
  return (
    <span id="providerSwitchBox">
      <span id="providerTypeSafeLabel">TypeSafe</span>
      <input id="providerSwitch" type="checkbox" role="switch" disabled aria-label="provider" />
      <span id="providerSubqLabel">SubQ</span>
    </span>
  );
}

function renderKeyEditor(): JSX.Element {
  return (
    <>
      <label id="typeSafeKeyLabel" for="typeSafeKeyEditor">TypeSafe API key</label>
      <input id="typeSafeKeyEditor" type="password" autocomplete="off" spellcheck="false" placeholder="TypeSafe API key" />
      <button id="showKeyButton">Show</button>
    </>
  );
}

export function renderHeaderRow(): JSX.Element {
  return (
    <div id="headerBox">
      {renderFileButtons()}
      {renderProviderSwitch()}
      {renderKeyEditor()}
      <span id="totalCostLabel">total cost: $0.000000</span>
      <span id="lastEditedLabel"></span>
      <button id="lightDarkModeButton">light</button>
    </div>
  );
}
