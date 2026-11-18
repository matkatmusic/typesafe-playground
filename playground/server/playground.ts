import { networkInterfaces } from 'node:os';
import { formatServerUrls, listLanAddresses } from '../startup/lanAddresses';
import { isLanArgument } from '../startup/parseLanArgument';
import { isRequestAllowed } from './playgroundGuard';
import { parsePortArgument } from '../startup/parsePortArgument';
import { HISTORY_PATH, initHistory, loadHistory } from '../history/playgroundHistory';
import { executeDraftGetRequest, executeDraftRequest } from './playgroundDraftRequests';
// import { executeDraftRequest, readDraft } from './playgroundDraftRequests';
import { renderPage } from '../page/renderPage';
import { executeNoteRequest } from './playgroundNoteRequests';
import { createClientForProvider, executeRunRequest, type CreateRunClient } from './playgroundRequests';
import { executeNewRequest, executeOpenRequest, executeResetRunsRequest, executeSaveRequest } from './playgroundVersionRequests';
import { buildErrorResponse } from './serverErrors';

export const SERVER_HOSTNAME = '127.0.0.1';
const LAN_HOSTNAME = '0.0.0.0';

async function buildClientScript(): Promise<string> {
  const result = await Bun.build({
    // entrypoints: [`${import.meta.dir}/../client/main.ts`],
    entrypoints: [`${import.meta.dir}/../client/page/main.ts`],
    target: 'browser',
    format: 'esm',
  });
  if (!result.success) {
    const logLines: string[] = [];
    for (const log of result.logs)
      logLines.push(log.message);
    throw new Error(`client build failed: ${logLines.join('\n')}`);
  }
  return result.outputs[0].text();
}

async function readPageCss(): Promise<string> {
  let css = '';
  for (const cssFileName of ['playgroundBase.css', 'playgroundPanels.css', 'playgroundEditors.css'])
    css += await Bun.file(`${import.meta.dir}/../page/${cssFileName}`).text();
  return css;
}

// function replacePlaceholderWithText(html: string, placeholder: string, text: string): string {
//   function getText() {
//     return text;
//   }
//   return html.replace(placeholder, getText);
// }

export async function buildPage(historyPath: string): Promise<string> {
  const versions = await loadHistory(historyPath);
  // const htmlFile = Bun.file(`${import.meta.dir}/../page/playground.html`);
  // const html = await htmlFile.text();
  const css = await readPageCss();
  const script = await buildClientScript();
  const hasEnvKey = (Bun.env.TYPESAFE_API_KEY ?? '').trim() !== '';
  // const draft = await readDraft(historyPath);
  // const safeJson = JSON.stringify({ versions, draft, hasEnvKey }).replaceAll('<', '\\u003c');
  // const safeJson = JSON.stringify({ versions, hasEnvKey }).replaceAll('<', '\\u003c');
  const hasSubqEnvKey = (Bun.env.SUBQ_AI_API_KEY ?? '').trim() !== '';
  // const safeJson = JSON.stringify({ versions, historyPath, hasEnvKey }).replaceAll('<', '\\u003c');
  const safeJson = JSON.stringify({ versions, historyPath, hasSubqEnvKey, hasEnvKey }).replaceAll('<', '\\u003c');
  // const withCss = replacePlaceholderWithText(html, '/*__PAGE_CSS__*/', css);
  // const withScript = replacePlaceholderWithText(withCss, '__PAGE_SCRIPT__', script);
  // return replacePlaceholderWithText(withScript, '__DATA_JSON__', safeJson);
  return '<!doctype html>' + renderPage({ css: css, script: script, dataJson: safeJson }).toString();
}

function dispatchVersionPostRequest(request: Request, pathname: string, historyPath: string): Promise<Response> | Response {
  switch (pathname) {
    case '/new':
      return executeNewRequest(historyPath);
    case '/open':
      return executeOpenRequest(request, historyPath);
    case '/save':
      return executeSaveRequest(historyPath);
    case '/reset-runs':
      return executeResetRunsRequest(request, historyPath);
    default:
      return new Response('not found', { status: 404 });
  }
}

function dispatchPostRequest(request: Request, pathname: string, historyPath: string, createClient: CreateRunClient): Promise<Response> | Response {
  switch (pathname) {
    case '/run':
      return executeRunRequest(request, createClient, historyPath);
    case '/note':
      return executeNoteRequest(request, historyPath);
    case '/draft':
      return executeDraftRequest(request, historyPath);
    default:
      return dispatchVersionPostRequest(request, pathname, historyPath);
  }
}

async function dispatchGetRequest(request: Request, pathname: string, historyPath: string): Promise<Response> {
  const isDraftGet = pathname === '/draft';
  if (isDraftGet)
    return executeDraftGetRequest(request, historyPath);
  const isPageGet = pathname === '/';
  if (isPageGet)
    return new Response(await buildPage(historyPath), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  return new Response('not found', { status: 404 });
}

export async function dispatchRequest(request: Request, port: number, historyPath: string, createClient: CreateRunClient = createClientForProvider, lanAddresses: string[] = []): Promise<Response> {
  const isAllowed = isRequestAllowed(request, SERVER_HOSTNAME, port, lanAddresses);
  if (!isAllowed)
    return new Response('forbidden', { status: 403 });
  const { pathname } = new URL(request.url);
  const isPost = request.method === 'POST';
  if (isPost)
    return dispatchPostRequest(request, pathname, historyPath, createClient);
  const isGet = request.method === 'GET';
  if (isGet)
    return dispatchGetRequest(request, pathname, historyPath);
  return new Response('not found', { status: 404 });
}

if (import.meta.main) {
  await initHistory(HISTORY_PATH);
  const isLan = isLanArgument(Bun.argv);
  const lanAddresses = isLan ? listLanAddresses(networkInterfaces()) : [];
  const server = Bun.serve({
    hostname: isLan ? LAN_HOSTNAME : SERVER_HOSTNAME,
    port: parsePortArgument(Bun.argv),
    fetch(request): Promise<Response> {
      if (server.port === undefined)
        throw new Error('server has no port');
      return dispatchRequest(request, server.port, HISTORY_PATH, createClientForProvider, lanAddresses);
    },
    error: buildErrorResponse,
  });
  if (server.port === undefined)
    throw new Error('server has no port');
  for (const url of formatServerUrls(SERVER_HOSTNAME, server.port, lanAddresses))
    console.log(url);
}
