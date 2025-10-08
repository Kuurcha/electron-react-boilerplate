import { NetworkInterfaceInfo } from './type';
import os from 'os';

export function getNetworkInterfaces(): NetworkInterfaceInfo[] {
  const interfaces = os.networkInterfaces();
  const result: NetworkInterfaceInfo[] = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    result.push({
      name,
      addresses: addrs.map((addr) => ({
        address: addr.address,
        family: addr.family,
        mac: addr.mac,
        internal: addr.internal,
      })),
    });
  }

  return result;
}
