import { Registration } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export interface QrPayload {
  token: string;
  expiresAt: string;
}

export const registrationApi = {
  async register(tournamentId: string): Promise<Registration> {
    const { data } = await apiClient.post('/registrations', { tournamentId });
    return data.data;
  },
  async cancel(registrationId: string): Promise<void> {
    await apiClient.delete(`/registrations/${registrationId}`);
  },
  async getCurrent(): Promise<Registration | null> {
    const { data } = await apiClient.get('/registrations/current');
    return data.data;
  },
  async getCurrentQr(): Promise<QrPayload> {
    const { data } = await apiClient.get('/registrations/current/qr');
    return data.data;
  },
};
