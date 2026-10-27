import { isRequestAllowed } from './playgroundGuard';

export const SERVER_HOSTNAME = '127.0.0.1';
export const SERVER_PORT = 4318;

export async function buildPage(): Promise<string> {
  const htmlFile = Bun.file(`${import.meta.dir}/page/playground.html`);
  const cssFile = Bun.file(`${import.meta.dir}/page/playground.css`);
  const html = await htmlFile.text();
  const css = await cssFile.text();
  function getCss() {
    return css;
  }
  return html.replace('__PAGE_CSS__', getCss);
}

export async function handleRequest(request: Request): Promise<Response> {
  const isAllowed = isRequestAllowed(request, SERVER_HOSTNAME, SERVER_PORT);
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
    port: SERVER_PORT,
    fetch: handleRequest,
  });
  console.log(`http://${SERVER_HOSTNAME}:${server.port}/`);
}
