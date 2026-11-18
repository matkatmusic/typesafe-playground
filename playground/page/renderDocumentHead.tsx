import { h, rawHtml } from './renderHtml';

export function renderDocumentHead(props: { css: string }): JSX.Element {
  return (
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Playground - Untitled</title>
      <style>{rawHtml(props.css)}</style>
    </head>
  );
}
