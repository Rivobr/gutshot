import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminTournamentsApi, CreateTournamentPayload } from '../api/tournament.api';

export function useAdminTournaments() {
  return useQuery({ queryKey: ['admin', 'tournaments'], queryFn: adminTournamentsApi.getAll });
}

export function useAdminTournament(id: string) {
  return useQuery({
    queryKey: ['admin', 'tournaments', id],
    queryFn: () => adminTournamentsApi.getById(id),
    enabled: !!id,
  });
}

export function useTournamentRegistrations(id: string) {
  return useQuery({
    queryKey: ['admin', 'tournaments', id, 'registrations'],
    queryFn: () => adminTournamentsApi.getRegistrations(id),
    enabled: !!id,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTournamentPayload) => adminTournamentsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });
}

export function useTournamentAction(action: 'open' | 'close' | 'start' | 'remove') {
  const queryClient = useQueryClient();
  const fn = {
    open: adminTournamentsApi.open,
    close: adminTournamentsApi.close,
    start: adminTournamentsApi.start,
    remove: adminTournamentsApi.remove,
  }[action];

  return useMutation({
    mutationFn: (id: string) => fn(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });
}

export function useFinishTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, results }: { id: string; results: { registrationId: string; place: number }[] }) =>
      adminTournamentsApi.finish(id, results),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });
}
