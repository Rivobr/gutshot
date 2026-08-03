import { useQuery } from '@tanstack/react-query';
import { tournamentApi } from '../api/tournament.api';

export function useTournaments() {
  return useQuery({ queryKey: ['tournaments'], queryFn: tournamentApi.getAll });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournaments', id],
    queryFn: () => tournamentApi.getById(id),
    enabled: !!id,
    refetchInterval: 20_000,
  });
}

export function useNearestTournament() {
  return useQuery({
    queryKey: ['tournaments', 'nearest'],
    queryFn: tournamentApi.getNearest,
    refetchInterval: 20_000,
  });
}

export function useTournamentParticipants(id: string) {
  return useQuery({
    queryKey: ['tournaments', id, 'participants'],
    queryFn: () => tournamentApi.getParticipants(id),
    enabled: !!id,
  });
}
