import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LevelThresholdDto, XpSettingDto } from '@gutshot/types';
import { xpConfigApi } from '../api/xp-config.api';

const XP_CONFIG_KEY = ['admin', 'xp-settings'];

export function useXpConfig() {
  return useQuery({ queryKey: XP_CONFIG_KEY, queryFn: xpConfigApi.get });
}

export function useUpdateXpSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: XpSettingDto[]) => xpConfigApi.updateSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: XP_CONFIG_KEY }),
  });
}

export function useUpdateLevels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (levels: LevelThresholdDto[]) => xpConfigApi.updateLevels(levels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: XP_CONFIG_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'players'] });
    },
  });
}
