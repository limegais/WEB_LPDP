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
