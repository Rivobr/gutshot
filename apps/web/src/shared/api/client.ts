import { createApiClient } from '@gutshot/shared';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

const TOKEN_KEY = 'gs_web_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // storage недоступен — сессия только на время вкладки
  }
}

export const api = createApiClient({
  baseURL: API_BASE_URL,
  getToken,
  onUnauthorized: () => {
    setToken(null);
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  },
  timeoutMs: 15_000,
});

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function apiGet<T>(url: string): Promise<T> {
  const { data } = await api.get<ApiEnvelope<T>>(url);
  return (data as ApiEnvelope<T>).data ?? (data as unknown as T);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiEnvelope<T>>(url, body ?? {});
  return (data as ApiEnvelope<T>).data ?? (data as unknown as T);
}

/** Человекочитаемое сообщение об ошибке API. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? fallback;
}
