import type { AdminPlayerListItem } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const adminPlayersApi = {
  async getAll(): Promise<AdminPlayerListItem[]> {
    const { data } = await apiClient.get('/admin/players');
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
};
