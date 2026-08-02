function resolveApiUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  // В Telegram Mini App предпочитаем same-origin /api/v1 — без CORS на api.*.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:3000/api/v1';
}

export const env = {
  apiUrl: resolveApiUrl(),
};
