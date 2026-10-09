export type DeviceType = 'inverter' | 'meter' | 'scb' | (string & {});

export interface Device {
  id: string;
  plantId: string;
  name: string;
  type: DeviceType;
  isOnline: boolean;
  createdAt: string | Date;
}

export interface SensorReading {
  id: number;
  deviceId: string;
  metric: string;
  value: number;
  timestamp: string | Date;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface Plant {
  id: string;
  name: string;
  location: string | null;
  monitoringClass: string;
  pnomKwp: number | null;
}

export interface DailyPerformance {
  day: string;
  yr: number | null;
  ya: number | null;
  yf: number | null;
  lc: number | null;
  ls: number | null;
  pr: number | null;
  prTempCorr: number | null;
  capacityFactor: number | null;
  systemAvailability: number | null;
  dataAvailability: number | null;
  eAcKwh: number | null;
  hPoaKwhM2: number | null;
}

export interface ComplianceCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface ComplianceReport {
  plantId: string;
  monitoringClass: string;
  summary: { pass: number; warn: number; fail: number; total: number };
  checks: ComplianceCheck[];
}
