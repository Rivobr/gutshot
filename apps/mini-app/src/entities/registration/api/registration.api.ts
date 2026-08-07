import { Registration } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const registrationApi = {
  async register(tournamentId: string): Promise<Registration> {
    const { data } = await apiClient.post('/registrations', { tournamentId });
    return data.data;
  },
  async cancel(registrationId: string): Promise<void> {
    await apiClient.delete(`/registrations/${registrationId}`);
  },
  async getCurrent(): Promise<Registration[]> {
    const { data } = await apiClient.get('/registrations/current');
    const payload = data.data;
    if (Array.isArray(payload)) return payload;
    // backward-compat if API still returns a single registration
    return payload ? [payload] : [];
  },
};
