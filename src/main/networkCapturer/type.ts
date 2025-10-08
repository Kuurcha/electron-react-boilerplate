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


