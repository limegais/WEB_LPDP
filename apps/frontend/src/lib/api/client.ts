import type { ApiListResponse, ComplianceReport, DailyPerformance, Device, HealthResponse, Plant, SensorReading } from '@ress/shared-types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  health: () => request<HealthResponse>('/health'),
  devices: () => request<ApiListResponse<Device>>('/api/devices'),
  readings: (limit = 100) => request<ApiListResponse<SensorReading>>(`/api/readings?limit=${limit}`),
  plants: () => request<ApiListResponse<Plant>>('/api/plants'),
  performance: (plantId: string, days = 30) =>
    request<ApiListResponse<DailyPerformance>>(`/api/plants/${plantId}/performance?days=${days}`),
  compliance: (plantId: string) => request<ComplianceReport>(`/api/plants/${plantId}/compliance`)
};
