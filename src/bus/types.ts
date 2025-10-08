export interface CaptureParams {
  maxPackets: string;
  duration: string;
}

export interface CaptureSettings extends CaptureParams {
  interfaceName: string;
}
