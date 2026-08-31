import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BroadcastSegment } from '@gutshot/types';
import {
  adminBroadcastApi,
  type CreateBroadcastInput,
  type UpdateBroadcastInput,
} from '../api/broadcast.api';

const KEY = ['admin', 'broadcasts'] as const;

export function useBroadcasts() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => adminBroadcastApi.list(),
  });
}

export function useBroadcast(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => adminBroadcastApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useBroadcastPreview(segment: BroadcastSegment, targetTelegramId?: string) {
  return useQuery({
    queryKey: [...KEY, 'preview', segment, targetTelegramId ?? ''],
    queryFn: () => adminBroadcastApi.preview(segment, targetTelegramId),
    enabled: segment === 'ALL_ACTIVE' || Boolean(targetTelegramId),
  });
}

export function useUploadBroadcastPhoto() {
  return useMutation({
    mutationFn: (file: File) => adminBroadcastApi.uploadPhoto(file),
  });
}

export function useCreateBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBroadcastInput) => adminBroadcastApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBroadcast(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBroadcastInput) => adminBroadcastApi.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: [...KEY, id] });
    },
  });
}

export function useSendBroadcast(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminBroadcastApi.send(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: [...KEY, id] });
    },
  });
}

export function useDeleteBroadcastMessages(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminBroadcastApi.deleteMessages(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...KEY, id] }),
  });
}

export function useDeleteBroadcastMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => adminBroadcastApi.deleteMessage(id, deliveryId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...KEY, id] }),
  });
}

export function useDeleteBroadcastDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminBroadcastApi.removeDraft(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
