import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, type ShiftEntryPayloadDto } from '../api/analytics.api';

export function useAnalyticsSummary(month?: string) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'summary', month ?? 'current'],
    queryFn: () => analyticsApi.summary(month),
  });
}

export function useAnalyticsShifts(month?: string) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'shifts', month ?? 'current'],
    queryFn: () => analyticsApi.shifts(month),
  });
}

export function useAnalyticsReEntries(month?: string, tournamentId?: string) {
  return useQuery({
    queryKey: ['admin', 'analytics', 're-entries', month ?? 'current', tournamentId ?? 'all'],
    queryFn: () => analyticsApi.reEntries(month, tournamentId),
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShiftEntryPayloadDto) => analyticsApi.createShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ShiftEntryPayloadDto> }) =>
      analyticsApi.updateShift(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });
}

export function useSetShiftPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) =>
      analyticsApi.setShiftPaid(id, paid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analyticsApi.deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });
}
