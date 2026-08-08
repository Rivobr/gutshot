import type { AdminPlayerListItem } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const adminPlayersApi = {
  async getAll(): Promise<AdminPlayerListItem[]> {
    const { data } = await apiClient.get('/admin/players');
    return data.data;
  },
  async createByTelegramId(payload: {
    telegramId: string;
    isVerified?: boolean;
  }): Promise<AdminPlayerListItem> {
    const { data } = await apiClient.post('/admin/players', payload);
    return data.data;
  },
  async getById(id: string) {
    const { data } = await apiClient.get(`/admin/players/${id}`);
    return data.data;
  },
  async block(id: string) {
    const { data } = await apiClient.patch(`/admin/players/${id}/block`);
    return data.data;
  },
  async unblock(id: string) {
    const { data } = await apiClient.patch(`/admin/players/${id}/unblock`);
    return data.data;
  },
  async verify(id: string) {
    const { data } = await apiClient.patch(`/admin/players/${id}/verify`);
    return data.data;
  },
  async unverify(id: string) {
    const { data } = await apiClient.patch(`/admin/players/${id}/unverify`);
    return data.data;
  },
};
