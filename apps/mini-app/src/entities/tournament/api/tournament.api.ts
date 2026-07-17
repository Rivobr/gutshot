import { Tournament, TournamentParticipant } from '@gutshot/types';
import { apiClient } from '../../../shared/api/client';

export const tournamentApi = {
  async getAll(): Promise<Tournament[]> {
    const { data } = await apiClient.get('/tournaments');
    return data.data;
  },
  async getById(id: string): Promise<Tournament> {
    const { data } = await apiClient.get(`/tournaments/${id}`);
    return data.data;
  },
  async getNearest(): Promise<Tournament | null> {
    const { data } = await apiClient.get('/tournaments/nearest');
    return data.data;
  },
  async getParticipants(id: string): Promise<TournamentParticipant[]> {
    const { data } = await apiClient.get(`/tournaments/${id}/participants`);
    return data.data;
  },
};
