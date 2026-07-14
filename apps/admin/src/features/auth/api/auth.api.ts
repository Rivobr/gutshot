import { AdminUserDto } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export interface AdminLoginResponse {
  accessToken: string;
  admin: AdminUserDto;
}

export const adminAuthApi = {
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const { data } = await apiClient.post('/auth/admin/login', { email, password });
    return data.data;
  },
};
