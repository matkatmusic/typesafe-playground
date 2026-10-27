import { isRequestAllowed } from './playgroundGuard';
import { parsePortArgument } from './parsePortArgument';
import { HISTORY_PATH, initHistory, loadHistory } from './playgroundHistory';
import { createTypeSafeClient, executeRunRequest, type CreateRunClient } from './playgroundRequests';
import { buildErrorResponse } from './serverErrors';

export const SERVER_HOSTNAME = '127.0.0.1';

async function buildClientScript(): Promise<string> {
  const result = await Bun.build({
    entrypoints: [`${import.meta.dir}/client/main.ts`],
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

export async function buildPage(historyPath: string): Promise<string> {
  const versions = await loadHistory(historyPath);
  const htmlFile = Bun.file(`${import.meta.dir}/page/playground.html`);
  const cssFile = Bun.file(`${import.meta.dir}/page/playground.css`);
  const html = await htmlFile.text();
  const css = await cssFile.text();
  const script = await buildClientScript();
  const hasEnvKey = (Bun.env.TYPESAFE_API_KEY ?? '').trim() !== '';
  const safeJson = JSON.stringify({ versions, hasEnvKey }).replaceAll('<', '\\u003c');
  function getCss() {
    return css;
  }
  function getScript() {
    return script;
  }
  function getSafeJson() {
    return safeJson;
  }
  const withCss = html.replace('__PAGE_CSS__', getCss);
  const withScript = withCss.replace('__PAGE_SCRIPT__', getScript);
  return withScript.replace('__DATA_JSON__', getSafeJson);
}

export async function dispatchRequest(request: Request, port: number, historyPath: string, createClient: CreateRunClient = createTypeSafeClient): Promise<Response> {
  const isAllowed = isRequestAllowed(request, SERVER_HOSTNAME, port);
  if (!isAllowed)
    return new Response('forbidden', { status: 403 });
  const { pathname } = new URL(request.url);
  const isRunPost = request.method === 'POST' && pathname === '/run';
  if (isRunPost)
    return executeRunRequest(request, createClient, historyPath);
  const isPageGet = request.method === 'GET' && pathname === '/';
  if (isPageGet)
    return new Response(await buildPage(historyPath), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  return new Response('not found', { status: 404 });
}

if (import.meta.main) {
  await initHistory(HISTORY_PATH);
  const server = Bun.serve({
    hostname: SERVER_HOSTNAME,
    port: parsePortArgument(Bun.argv),
    fetch(request): Promise<Response> {
      if (server.port === undefined)
        throw new Error('server has no port');
      return dispatchRequest(request, server.port, HISTORY_PATH);
    },
    error: buildErrorResponse,
  });
  console.log(`http://${SERVER_HOSTNAME}:${server.port}/`);
}
