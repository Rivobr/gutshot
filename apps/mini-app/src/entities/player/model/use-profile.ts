import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlayerProfileDto } from '@gutshot/types';
import { playerApi } from '../api/player.api';
import { getTelegramInitData } from '../../../shared/lib/telegram';
import { loginWithTelegramInitData } from '../../../processes/startup/use-startup';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: playerApi.getProfile,
    retry: 1,
    staleTime: 60_000,
    // Не висеть бесконечно при плохой сети — ConsentGate тоже режет по таймеру.
    meta: { critical: true },
  });
}

/** Постоянный персональный QR-код игрока. Не меняется, поэтому кешируется надолго. */
export function usePlayerQrCode() {
  return useQuery({
    queryKey: ['profile', 'qr'],
    queryFn: playerApi.getQrCode,
    staleTime: Infinity,
  });
}

export function usePlayerEvents() {
  return useQuery({ queryKey: ['profile', 'events'], queryFn: playerApi.getEvents });
}

export function useAchievements() {
  return useQuery({ queryKey: ['profile', 'achievements'], queryFn: playerApi.getAchievements });
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

export function useLegalDocuments() {
  return useQuery({
    queryKey: ['legal-documents'],
    queryFn: playerApi.getLegalDocuments,
    staleTime: 5 * 60_000,
  });
}

export function useAchievementTexts() {
  return useQuery({
    queryKey: ['achievement-texts'],
    queryFn: playerApi.getAchievementTexts,
    staleTime: 60_000,
  });
}

export function useAcceptConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        return await playerApi.acceptConsent();
      } catch (error) {
        // Протухший JWT на экране согласия — перелогин и один повтор.
        if (!isAxiosError(error) || error.response?.status !== 401) {
          throw error;
        }
        const initData = getTelegramInitData();
        if (!initData) {
          throw error;
        }
        await loginWithTelegramInitData(initData);
        return playerApi.acceptConsent();
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['profile'], (current: PlayerProfileDto | undefined) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          consentAcceptedAt: result.consentAcceptedAt,
        };
      });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdateNickname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nickname: string) => playerApi.updateNickname(nickname),
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile'], profile);
      queryClient.invalidateQueries({ queryKey: ['rating'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}
