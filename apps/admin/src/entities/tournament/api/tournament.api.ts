import type { AdminTournamentRegistration, Tournament } from '@gutshot/types';
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
  imageUrl?: string;
}

export interface UpdateTournamentLivePayload {
  isRunning?: boolean;
  level?: number;
  smallBlind?: number;
  bigBlind?: number;
  ante?: number;
  nextBreakInSec?: number;
  playersIn?: number;
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
  async updateLive(id: string, payload: UpdateTournamentLivePayload) {
    const { data } = await apiClient.patch(`/admin/tournaments/${id}/live`, payload);
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
  async archive(id: string) {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/archive`);
    return data.data;
  },
  async finish(id: string, results: { registrationId: string; place: number }[]) {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/finish`, results);
    return data.data;
  },
  async getRegistrations(id: string): Promise<AdminTournamentRegistration[]> {
    const { data } = await apiClient.get(`/admin/tournaments/${id}/registrations`);
    return data.data;
  },
  async markAttendance(id: string, registrationId: string, arrived: boolean) {
    const { data } = await apiClient.post(
      `/admin/tournaments/${id}/registrations/${registrationId}/attendance`,
      { arrived },
    );
    return data.data;
  },
};
