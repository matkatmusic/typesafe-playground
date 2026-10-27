import { isRequestAllowed } from './playgroundGuard';
import { parsePortArgument } from './parsePortArgument';

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

export async function buildPage(): Promise<string> {
  const htmlFile = Bun.file(`${import.meta.dir}/page/playground.html`);
  const cssFile = Bun.file(`${import.meta.dir}/page/playground.css`);
  const html = await htmlFile.text();
  const css = await cssFile.text();
  const script = await buildClientScript();
  function getCss() {
    return css;
  }
  function getScript() {
    return script;
  }
  const withCss = html.replace('__PAGE_CSS__', getCss);
  return withCss.replace('__PAGE_SCRIPT__', getScript);
}

export async function dispatchRequest(request: Request, port: number): Promise<Response> {
  const isAllowed = isRequestAllowed(request, SERVER_HOSTNAME, port);
  if (!isAllowed)
    return new Response('forbidden', { status: 403 });
  const { pathname } = new URL(request.url);
  const isPageGet = request.method === 'GET' && pathname === '/';
  if (isPageGet)
    return new Response(await buildPage(), { headers: { 'content-type': 'text/html; charset=utf-8' } });
  return new Response('not found', { status: 404 });
}

if (import.meta.main) {
  const server = Bun.serve({
    hostname: SERVER_HOSTNAME,
    port: parsePortArgument(Bun.argv),
    fetch(request): Promise<Response> {
      if (server.port === undefined)
        throw new Error('server has no port');
      return dispatchRequest(request, server.port);
    },
  });
  console.log(`http://${SERVER_HOSTNAME}:${server.port}/`);
}
