export interface NetworkAddress {
  address: string;
  family: string;
  mac: string;
  internal: boolean;
}

export interface NetworkInterfaceInfo {
  name: string;
  addresses: NetworkAddress[];
}

export type CaptureState = 'running' | 'stopped';

export interface CaptureStatus {
  state: CaptureState;
  message?: string;
  filePath?: string;
}

export interface PoissonParams {
  lambda: number;
  mu: number;
  totalTime: number;
}
