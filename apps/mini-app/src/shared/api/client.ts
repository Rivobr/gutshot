import { createApiClient } from '@gutshot/shared';
import { env } from '../config/env';
import { tokenStorage } from '../lib/token-storage';

const REAUTH_FLAG = 'gutshot_reauth_once';

export const apiClient = createApiClient({
  baseURL: env.apiUrl,
  getToken: () => tokenStorage.get(),
  onUnauthorized: () => {
    const hadToken = Boolean(tokenStorage.get());
    tokenStorage.clear();

    if (!hadToken) {
      return;
    }

    // Один автоматический reload за сессию вкладки — без бесконечного цикла.
    try {
      if (sessionStorage.getItem(REAUTH_FLAG)) {
        return;
      }
      sessionStorage.setItem(REAUTH_FLAG, '1');
    } catch {
      // ignore
    }

    window.location.reload();
  },
});
