import type {
  AdminTournamentRegistration,
  BlindLevel,
  Tournament,
  TournamentClock,
} from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export interface TournamentClockResponse {
  clock: TournamentClock;
  levels: BlindLevel[];
}

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
  async getClock(id: string): Promise<TournamentClockResponse> {
    const { data } = await apiClient.get(`/admin/tournaments/${id}/clock`);
    return data.data;
  },
  async saveBlindStructure(id: string, levels: BlindLevel[]): Promise<TournamentClockResponse> {
    const { data } = await apiClient.put(`/admin/tournaments/${id}/blind-structure`, {
      levels: levels.map((level) => ({
        isBreak: level.isBreak,
        smallBlind: level.isBreak ? undefined : (level.smallBlind ?? undefined),
        bigBlind: level.isBreak ? undefined : (level.bigBlind ?? undefined),
        ante: level.isBreak ? undefined : (level.ante ?? undefined),
        durationSec: level.durationSec,
      })),
    });
    return data.data;
  },
  async applyDefaultStructure(
    id: string,
    template: 'classic20' | 'club' = 'classic20',
  ): Promise<TournamentClockResponse> {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/blind-structure/default`, {
      template,
    });
    return data.data;
  },
  async clockAction(
    id: string,
    action: 'start' | 'pause' | 'resume' | 'stop',
  ): Promise<TournamentClockResponse> {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/clock/${action}`);
    return data.data;
  },
  async setClockLevel(id: string, levelIdx: number): Promise<TournamentClockResponse> {
    const { data } = await apiClient.post(`/admin/tournaments/${id}/clock/level/${levelIdx}`);
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
  async setPlace(
    id: string,
    registrationId: string,
    place: number | null,
  ): Promise<AdminTournamentRegistration[]> {
    const { data } = await apiClient.patch(
      `/admin/tournaments/${id}/registrations/${registrationId}/place`,
      { place },
    );
    return data.data;
  },
  async eliminate(id: string, registrationId: string): Promise<AdminTournamentRegistration[]> {
    const { data } = await apiClient.post(
      `/admin/tournaments/${id}/registrations/${registrationId}/eliminate`,
    );
    return data.data;
  },
};
