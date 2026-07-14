import { User } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export interface TelegramLoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  async loginWithTelegram(initData: string): Promise<TelegramLoginResponse> {
    const { data } = await apiClient.post('/auth/telegram', { initData });
    return data.data;
  },
};
