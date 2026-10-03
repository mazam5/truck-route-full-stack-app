import axios from 'axios';
import type { TripInput, TripPlanResponse, GeoLocation } from '../types/trip';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export async function planTruckRoute(input: TripInput): Promise<TripPlanResponse> {
  const response = await apiClient.post<TripPlanResponse>('/route-plan/', input);
  return response.data;
}

export async function searchPlaces(query: string): Promise<GeoLocation[]> {
  try {
    const response = await apiClient.get<GeoLocation[]>('/places/search/', {
      params: { q: query },
    });
    return response.data;
  } catch (err) {
    console.warn('Place search API error, using fallback:', err);
    return [];
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get<{ status: string }>('/health/');
    return response.data.status === 'healthy';
  } catch {
    return false;
  }
}
