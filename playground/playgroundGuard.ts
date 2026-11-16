export function listAllowedHosts(hostname: string, port: number, lanAddresses: string[] = []): string[] {
  const hosts = [`${hostname}:${port}`, `localhost:${port}`];
  for (const address of lanAddresses)
    hosts.push(`${address}:${port}`);
  return hosts;
}

function isOriginAllowed(request: Request, allowedHosts: string[]): boolean {
  const origin = request.headers.get('origin');
  let isOriginInAllowedHosts = false;
  for (const allowedHost of allowedHosts) {
    if (origin === `http://${allowedHost}`)
      isOriginInAllowedHosts = true;
  }
  return isOriginInAllowedHosts;
}

function isContentTypeJson(request: Request): boolean {
  const contentType = request.headers.get('content-type');
  if (contentType === null)
    return false;
  const mediaType = contentType.split(';')[0].trim().toLowerCase();
  return mediaType === 'application/json';
}

export function isRequestAllowed(request: Request, hostname: string, port: number, lanAddresses: string[] = []): boolean {
  const allowedHosts = listAllowedHosts(hostname, port, lanAddresses);
  const host = request.headers.get('host');
  const isHostAllowed = host !== null && allowedHosts.includes(host);
  if (!isHostAllowed)
    return false;
  if (request.method !== 'POST')
    return true;
  const isOriginInAllowedHosts = isOriginAllowed(request, allowedHosts);
  if (!isOriginInAllowedHosts)
    return false;
  return isContentTypeJson(request);
}
