import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registrationApi } from '../api/registration.api';

export function useCurrentRegistration() {
  return useQuery({ queryKey: ['registrations', 'current'], queryFn: registrationApi.getCurrent });
}

export function useCurrentQr(enabled: boolean) {
  return useQuery({
    queryKey: ['registrations', 'current', 'qr'],
    queryFn: registrationApi.getCurrentQr,
    enabled,
    refetchInterval: 30_000,
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tournamentId: string) => registrationApi.register(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (registrationId: string) => registrationApi.cancel(registrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}
