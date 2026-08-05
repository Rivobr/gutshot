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
    // Медленный iOS/TLS: несколько попыток с паузой, пока ConsentGate ждёт до 25с.
    retry: 3,
    retryDelay: (attempt) => Math.min(1_500, 350 * 2 ** attempt),
    staleTime: 60_000,
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
  return useQuery({
    queryKey: ['profile', 'tournaments'],
    queryFn: playerApi.getTournamentHistory,
  });
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

/** Каталог достижений клуба — единый источник с сервера. */
export function useAchievementsCatalog() {
  return useQuery({
    queryKey: ['achievements-catalog'],
    queryFn: playerApi.getAchievementsCatalog,
    staleTime: 10 * 60_000,
  });
}

async function acceptConsentWithRetry(): Promise<{ consentAcceptedAt: string }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await playerApi.acceptConsent();
    } catch (error) {
      lastError = error;
      // Протухший JWT на экране согласия — перелогин и повтор.
      if (isAxiosError(error) && error.response?.status === 401) {
        const initData = getTelegramInitData();
        if (!initData) {
          throw error;
        }
        await loginWithTelegramInitData(initData);
        return playerApi.acceptConsent();
      }
      // Сетевой обрыв (часто iOS WebView + SSL keepalive) — короткая пауза и повтор.
      const isNetwork = isAxiosError(error) && !error.response;
      if (!isNetwork || attempt === 3) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }
  throw lastError;
}

export function useAcceptConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => acceptConsentWithRetry(),
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

export function usePinAchievements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (achievementIds: string[]) => playerApi.setPinnedAchievements(achievementIds),
    onSuccess: (result) => {
      queryClient.setQueryData(['profile'], (current: PlayerProfileDto | undefined) =>
        current ? { ...current, pinnedAchievements: result.pinnedAchievements } : current,
      );
      void queryClient.invalidateQueries({ queryKey: ['tournaments'] });
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
