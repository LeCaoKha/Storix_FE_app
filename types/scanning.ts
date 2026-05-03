export interface ScanResult {
  code: string;
  type: ScanningType;
  data: any;
  timestamp: Date;
}

export enum ScanningType {
  BARCODE = 'barcode',
  QR_CODE = 'qr_code',
  RFID = 'rfid',
}

export interface ScannerConfig {
  type: ScanningType[];
  continuous?: boolean;
  vibrate?: boolean;
  sound?: boolean;
}