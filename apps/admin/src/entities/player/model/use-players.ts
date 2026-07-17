import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminPlayersApi } from '../api/player.api';

export function usePlayers() {
  return useQuery({ queryKey: ['admin', 'players'], queryFn: adminPlayersApi.getAll });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ['admin', 'players', id],
    queryFn: () => adminPlayersApi.getById(id),
    enabled: !!id,
  });
}

export function useTogglePlayerBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
      blocked ? adminPlayersApi.unblock(id) : adminPlayersApi.block(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'players'] }),
  });
}

export function useTogglePlayerVerify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      verified ? adminPlayersApi.unverify(id) : adminPlayersApi.verify(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'players'] }),
  });
}
