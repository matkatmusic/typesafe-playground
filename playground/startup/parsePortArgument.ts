const AUTO_PORT = 0;

export function parsePortArgument(argumentList: string[]): number {
  const flagIndex = argumentList.indexOf('--port');
  const isFlagMissing = flagIndex === -1;
  if (isFlagMissing)
    return AUTO_PORT;
  const portText = argumentList[flagIndex + 1];
  const port = Number(portText);
  const isPortValid = Number.isInteger(port) && port >= 1 && port <= 65535;
  if (!isPortValid)
    throw new Error(`--port needs a whole number from 1 to 65535, got ${portText}`);
  return port;
}
