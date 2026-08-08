import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../api/auth.api';
import { adminSession } from '../../../shared/lib/admin-session';
import { tokenStorage } from '../../../shared/lib/token-storage';
import { apiClient } from '../../../shared/api/client';

export function useAdminLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminAuthApi.login(email, password),
    onSuccess: (response) => {
      tokenStorage.set(response.accessToken);
      adminSession.set(response.admin);
      navigate(response.admin.role === 'DEALER' ? '/scanner' : '/');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();

  return () => {
    const token = tokenStorage.get();
    if (token) {
      void apiClient.post('/auth/logout').catch(() => undefined);
    }
    tokenStorage.clear();
    adminSession.clear();
    navigate('/login');
  };
}

export function useAdminRole() {
  return adminSession.role();
}
