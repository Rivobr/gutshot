import { useQuery } from '@tanstack/react-query';
import { adminHistoryApi, HistoryQuery } from '../api/history.api';

export function useAdminHistory(query: HistoryQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'history', query],
    queryFn: () => adminHistoryApi.find(query),
  });
}
