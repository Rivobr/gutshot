import { createApiClient } from '@gutshot/shared';
import { env } from '../config/env';
import { tokenStorage } from '../lib/token-storage';

export const apiClient = createApiClient({
  baseURL: env.apiUrl,
  getToken: () => tokenStorage.get(),
  onUnauthorized: () => {
    tokenStorage.clear();
    window.location.href = '/login';
  },
});
