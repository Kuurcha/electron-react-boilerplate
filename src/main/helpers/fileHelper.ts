import { app } from 'electron';
import path from 'path';

/**
 * Returns the default file path in the root of the Electron app.
 * @param fileName Name of the file (default: "sniffer_log.txt")
 * @returns Absolute path to the file in app root
 */
export function getAppRootFilePath(
  fileName: string = 'sniffer_log.txt',
): string {
  return path.join(app.getAppPath(), fileName);
}
