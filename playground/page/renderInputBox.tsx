import { h } from './renderHtml';
import { renderStateAndQuestionsBox } from './renderStateAndQuestionsBox';

export function renderCostTokenSubmitBox(): JSX.Element {
  return (
    <div id="costTokenSubmitBox">
      <span id="costLabel">Cost: $0.000000</span>
      <span id="tokensLabel">Tokens: 0</span>
      <div id="callsSubmitGroup">
        <label id="callsLabel" for="callsPicker">Calls</label>
        <input id="callsPicker" type="number" min={1} max={10} step={1} value={1} title="Calls per submit" />
        <button id="submitButton">Submit (paid)</button>
      </div>
    </div>
  );
}

export function renderErrorLine(): JSX.Element {
  return <div id="errorLine"></div>;
}

export function renderInputBox(): JSX.Element {
  return (
    <div id="inputBox">
      {renderCostTokenSubmitBox()}
      {renderErrorLine()}
      {renderStateAndQuestionsBox()}
    </div>
  );
}
