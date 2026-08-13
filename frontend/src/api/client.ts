import { Registration, Workshop, WorkshopInput } from '@shared/types';
import { getCurrentSession } from '../auth/cognito';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_CONFIG_ERROR =
  'Configura VITE_API_URL en frontend/.env con la URL del API antes de cargar talleres.';

type ListWorkshopsParams = {
  limit?: number;
  nextToken?: string;
  category?: string;
  includeCancelled?: boolean;
};

type ListWorkshopsResponse = {
  items: Workshop[];
  nextToken?: string;
};

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(API_CONFIG_ERROR);
  }

  const idToken = await getCurrentSession();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (idToken) {
    headers.set('Authorization', `Bearer ${idToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: unknown;

  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('El API no devolvio JSON. Revisa que VITE_API_URL apunte al backend correcto.');
  }

  if (!response.ok) {
    const title =
      data && typeof data === 'object' && 'title' in data && typeof data.title === 'string'
        ? data.title
        : `HTTP ${response.status}`;

    throw new Error(title);
  }

  return data as T;
}

export function listWorkshops(params: ListWorkshopsParams = {}): Promise<ListWorkshopsResponse> {
  const query = new URLSearchParams();

  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  if (params.nextToken) {
    query.set('nextToken', params.nextToken);
  }

  if (params.category) {
    query.set('category', params.category);
  }

  if (params.includeCancelled) {
    query.set('includeCancelled', 'true');
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<ListWorkshopsResponse>(`/workshops${suffix}`);
}

export function getWorkshop(id: string): Promise<Workshop> {
  return apiFetch<Workshop>(`/workshops/${encodeURIComponent(id)}`);
}

export function createWorkshop(input: WorkshopInput): Promise<Workshop> {
  return apiFetch<Workshop>('/workshops', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateWorkshop(id: string, patch: Partial<WorkshopInput>): Promise<Workshop> {
  return apiFetch<Workshop>(`/workshops/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export function deleteWorkshop(id: string): Promise<void> {
  return apiFetch<void>(`/workshops/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function registerToWorkshop(id: string): Promise<Registration> {
  return apiFetch<Registration>(`/workshops/${encodeURIComponent(id)}/register`, {
    method: 'POST',
  });
}
