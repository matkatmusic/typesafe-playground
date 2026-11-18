import { h, rawHtml } from './renderHtml';
import { renderDialogs } from './renderDialogs';
import { renderDocumentHead } from './renderDocumentHead';
import { renderHeaderRow } from './renderHeaderRow';
import { renderInputBox } from './renderInputBox';
import { renderResultBox } from './renderResultBox';
import { renderVersionBox } from './renderVersionBox';

type PageProps = { css: string; script: string; dataJson: string };

function renderInputResultsBox(): JSX.Element {
  return (
    <div id="inputResultsBox">
      {renderInputBox()}
      <div class="column-resizer" id="columnResizer"></div>
      {renderResultBox()}
    </div>
  );
}

function renderPageBody(props: PageProps): JSX.Element {
  return (
    <body id="playgroundComponentBox">
      {renderDialogs()}
      {renderHeaderRow()}
      {renderVersionBox()}
      {renderInputResultsBox()}
      <script type="application/json" id="data">{rawHtml(props.dataJson)}</script>
      <script type="module">{rawHtml(props.script)}</script>
    </body>
  );
}

export function renderPage(props: PageProps): JSX.Element {
  return (
    <html lang="en">
      {renderDocumentHead({ css: props.css })}
      {renderPageBody(props)}
    </html>
  );
}
