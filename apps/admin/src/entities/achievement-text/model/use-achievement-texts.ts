import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AchievementTextId } from '@gutshot/types';
import { achievementTextsApi } from '../api/achievement-text.api';

const ACHIEVEMENT_TEXTS_KEY = ['admin', 'achievement-texts'];

export function useAchievementTexts() {
  return useQuery({ queryKey: ACHIEVEMENT_TEXTS_KEY, queryFn: achievementTextsApi.getAll });
}

export function useSaveAchievementText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      icon,
      title,
      description,
      howTo,
    }: {
      id: AchievementTextId;
      icon: string;
      title: string;
      description: string;
      howTo: string;
    }) => achievementTextsApi.save(id, { icon, title, description, howTo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACHIEVEMENT_TEXTS_KEY }),
  });
}
