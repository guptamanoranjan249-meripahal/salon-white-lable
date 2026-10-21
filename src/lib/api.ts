import type { OwnerBooking, PublicSalon, SalonOwner, SalonRecord } from '../types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface Envelope<T> {
  data: T;
}

export interface AuthPayload {
  user: SalonOwner;
  salon: SalonRecord | null;
}

export interface PublicMeta {
  publicBaseUrl: string;
  publicBaseDomain: string;
  platformName: string;
  supportEmail: string;
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(path, {
    method: options.method || 'GET',
    credentials: 'same-origin',
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  let payload: Envelope<T> | { error?: string };
  try {
    payload = await response.json();
  } catch {
    throw new ApiError('The server returned an unexpected response. Please try again.', response.status);
  }
  if (!response.ok) {
    throw new ApiError(('error' in payload && payload.error) || 'Something went wrong. Please try again.', response.status);
  }
  return 'data' in payload ? payload.data : (undefined as T);
}

export function getCurrentUser(): Promise<AuthPayload> {
  return apiRequest<AuthPayload>('/api/auth/me');
}

export function getPublicSalon(slug?: string): Promise<PublicSalon | null> {
  const query = slug ? `?slug=${encodeURIComponent(slug)}` : '';
  return apiRequest<PublicSalon | null>(`/api/public/resolve${query}`);
}

export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read this image.'));
    reader.onerror = () => reject(new Error('Unable to read this image.'));
    reader.readAsDataURL(file);
  });
  const response = await apiRequest<{ url: string }>('/api/uploads', { method: 'POST', body: { dataUrl } });
  return response.url;
}

export function getOwnerBookings(salonId: string): Promise<OwnerBooking[]> {
  return apiRequest<OwnerBooking[]>(`/api/salons/${encodeURIComponent(salonId)}/bookings`);
}
