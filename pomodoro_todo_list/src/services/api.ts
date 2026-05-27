const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('pomo_token');
}

async function uploadFile(path: string, file: File): Promise<{ url: string }> {
  const token = getToken();
  const body = new FormData();
  body.append('file', file);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error(`Error ${res.status} al subir archivo`);
  return res.json() as Promise<{ url: string }>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(Array.isArray(msg) ? msg[0] : (msg ?? `Error ${res.status}`));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AuthResponse {
  access_token: string;
  user: { id: number; email: string; name: string };
}

export const api = {
  uploads: {
    uploadImage: (file: File) => uploadFile('/uploads', file).then(r => r.url),
  },
  auth: {
    register: (name: string, email: string, password: string) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ id: number; email: string; name: string }>('/auth/me'),
  },
  days: {
    getAll: () => request<Record<string, { id: number; cards: unknown[] }>>('/days'),
  },
  cards: {
    create: (data: {
      id: string;
      date: string;
      title: string;
      description?: unknown;
      status?: string;
    }) =>
      request<unknown>('/cards', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { title?: string; description?: unknown; status?: string }) =>
      request<unknown>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
      request<void>(`/cards/${id}`, { method: 'DELETE' }),
    incrementStat: (id: string, stat: 'pomodoroCount' | 'shortBreakCount' | 'longBreakCount') =>
      request<unknown>(`/cards/${id}/stat`, { method: 'PATCH', body: JSON.stringify({ stat }) }),
  },
};
