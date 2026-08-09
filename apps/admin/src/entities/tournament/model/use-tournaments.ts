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

export function useMarkAttendance(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ registrationId, arrived }: { registrationId: string; arrived: boolean }) =>
      adminTournamentsApi.markAttendance(tournamentId, registrationId, arrived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'players'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'history'] });
    },
  });
}

function invalidateTournamentPlayers(
  queryClient: ReturnType<typeof useQueryClient>,
  tournamentId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ['admin', 'tournaments', tournamentId, 'registrations'],
  });
  queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments', tournamentId] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
}

/** Проставить / сбросить место во время турнира. */
export function useSetTournamentPlace(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ registrationId, place }: { registrationId: string; place: number | null }) =>
      adminTournamentsApi.setPlace(tournamentId, registrationId, place),
    onSuccess: (registrations) => {
      queryClient.setQueryData(
        ['admin', 'tournaments', tournamentId, 'registrations'],
        registrations,
      );
      invalidateTournamentPlayers(queryClient, tournamentId);
    },
  });
}

/** Игрок выбыл — авто-место с конца. */
export function useEliminatePlayer(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      adminTournamentsApi.eliminate(tournamentId, registrationId),
    onSuccess: (registrations) => {
      queryClient.setQueryData(
        ['admin', 'tournaments', tournamentId, 'registrations'],
        registrations,
      );
      invalidateTournamentPlayers(queryClient, tournamentId);
    },
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTournamentPayload) => adminTournamentsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });
}

export function useUpdateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateTournamentPayload> }) =>
      adminTournamentsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments', variables.id] });
    },
  });
}

/** Добавить игрока в турнир по Telegram ID. */
export function useAddTournamentPlayer(tournamentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (telegramId: string) =>
      adminTournamentsApi.addPlayerByTelegramId(tournamentId, telegramId),
    onSuccess: (registrations) => {
      queryClient.setQueryData(
        ['admin', 'tournaments', tournamentId, 'registrations'],
        registrations,
      );
      invalidateTournamentPlayers(queryClient, tournamentId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'players'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'history'] });
    },
  });
}

export type TournamentAction = 'open' | 'close' | 'start' | 'archive' | 'remove';

export function useTournamentAction(action: TournamentAction) {
  const queryClient = useQueryClient();
  const fn = {
    open: adminTournamentsApi.open,
    close: adminTournamentsApi.close,
    start: adminTournamentsApi.start,
    archive: adminTournamentsApi.archive,
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
    mutationFn: ({
      id,
      results,
    }: {
      id: string;
      results: { registrationId: string; place: number }[];
    }) => adminTournamentsApi.finish(id, results),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'history'] });
    },
  });
}
