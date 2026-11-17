import type { NetworkInterfaceInfo } from 'node:os';

export function listLanAddresses(interfaces: Record<string, NetworkInterfaceInfo[] | undefined>): string[] {
  const addresses: string[] = [];
  for (const infos of Object.values(interfaces)) {
    for (const info of infos ?? []) {
      const isLanIpv4 = info.family === 'IPv4' && !info.internal;
      if (isLanIpv4)
        addresses.push(info.address);
    }
  }
  return addresses;
}

export function formatServerUrls(hostname: string, port: number, lanAddresses: string[]): string[] {
  const urls = [`http://${hostname}:${port}/`];
  for (const address of lanAddresses)
    urls.push(`http://${address}:${port}/`);
  return urls;
}
