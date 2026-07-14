import type { AdminDashboard } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const dashboardApi = {
  async get(): Promise<AdminDashboard> {
    const { data } = await apiClient.get('/admin/dashboard');
    return data.data;
  },
};
