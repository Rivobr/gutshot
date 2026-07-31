import { createApiClient } from '@gutshot/shared';
import { env } from '../config/env';
import { tokenStorage } from '../lib/token-storage';

export const apiClient = createApiClient({
  baseURL: env.apiUrl,
  getToken: () => tokenStorage.get(),
  onUnauthorized: () => {
    const hadToken = Boolean(tokenStorage.get());
    tokenStorage.clear();

    // Reload только если сессия реально была — иначе логин с 401
    // зацикливает экран загрузки у новых пользователей.
    if (hadToken) {
      window.location.reload();
    }
  },
});
