import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ScannerEventType } from '@gutshot/types';
import { scannerApi } from '../api/scanner.api';

export function useScanPlayer() {
  return useMutation({ mutationFn: (qrCode: string) => scannerApi.findPlayer(qrCode) });
}

export function useApplyScannerEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { qrCode: string; event: ScannerEventType; tournamentId?: string }) =>
      scannerApi.applyEvent(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'players'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'statistics'] });
      if (variables.tournamentId) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'tournaments', variables.tournamentId, 'registrations'],
        });
        queryClient.invalidateQueries({
          queryKey: ['admin', 'tournaments', variables.tournamentId],
        });
      }
    },
  });
}
