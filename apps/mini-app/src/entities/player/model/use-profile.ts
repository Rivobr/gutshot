import { useQuery } from '@tanstack/react-query';
import { playerApi } from '../api/player.api';

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: playerApi.getProfile });
}

export function useXpHistory() {
  return useQuery({ queryKey: ['profile', 'history'], queryFn: playerApi.getXpHistory });
}

export function useTournamentHistory() {
  return useQuery({ queryKey: ['profile', 'tournaments'], queryFn: playerApi.getTournamentHistory });
}

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: playerApi.getNotifications });
}
