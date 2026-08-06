import axios, { AxiosInstance } from 'axios';

export interface CreateApiClientOptions {
  baseURL: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
  /** Default 20s — slow mobile TLS needs headroom before retry. */
  timeoutMs?: number;
}

/** Эндпоинты логина: 401 здесь — ошибка входа, а не «сессия истекла». */
function isAuthLoginRequest(url?: string): boolean {
  if (!url) {
    return false;
  }

  return url.includes('/auth/telegram') || url.includes('/auth/admin/login');
}

export function createApiClient(options: CreateApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseURL,
    headers: { 'Content-Type': 'application/json' },
    // Slow iOS Telegram WebViews need headroom; callers also retry.
    timeout: options.timeoutMs ?? 12_000,
  });

  client.interceptors.request.use((config) => {
    const token = options.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Пустое тело + Content-Type: application/json ломает Nest body-parser (400).
    if (config.data === undefined || config.data === null) {
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const requestUrl = String(error.config?.url ?? '');

      // Нельзя делать reload на 401 логина — иначе новые пользователи
      // попадают в бесконечный цикл загрузки.
      if (status === 401 && !isAuthLoginRequest(requestUrl)) {
        options.onUnauthorized?.();
      }

      return Promise.reject(error);
    },
  );

  return client;
}
