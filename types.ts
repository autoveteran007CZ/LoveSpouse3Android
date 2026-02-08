export interface BlePacket {
  companyId: number;
  manufacturerData: number[];
}

export enum AppMode {
  MANUAL = 'MANUAL',
  BPM = 'BPM'
}

export interface BpmState {
  patternIndex: number;
  onMs: number;
  offMs: number;
}
