import type { Tournament } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export type AdminTournament = Tournament & { _count?: { registrations: number } };

export interface CreateTournamentPayload {
  title: string;
  description?: string;
  date: string;
  buyIn: number;
  maxPlayers: number;
  registrationOpen?: string;
  registrationClose?: string;
}

export const adminTournamentsApi = {
  async getAll(): Promise<AdminTournament[]> {
    const { data } = await apiClient.get('/admin/tournaments');
    return data.data;
  },
  async getById(id: string) {
    const { data } = await apiClient.get(`/admin/tournaments/${id}`);
    return data.data;
  },
  async create(payload: CreateTournamentPayload) {
    const { data } = await apiClient.post('/admin/tournaments', payload);
    return data.data;
  },
  async update(id: string, payload: Partial<CreateTournamentPayload>) {
    const { data } = await apiClient.patch(`/admin/tournaments/${id}`, payload);
    return data.data;
  },
  async remove(id: string) {
    await apiClient.delete(`/admin/tournaments/${id}`);
  },
  async open(id: string) {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/open`);
    return data.data;
  },
  async close(id: string) {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/close`);
    return data.data;
  },
  async start(id: string) {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/start`);
    return data.data;
  },
  async finish(id: string, results: { registrationId: string; place: number }[]) {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/finish`, results);
    return data.data;
  },
  async getRegistrations(id: string) {
    const { data } = await apiClient.get(`/admin/tournaments/${id}/registrations`);
    return data.data;
  },
};
