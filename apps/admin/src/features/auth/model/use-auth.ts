import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../api/auth.api';
import { tokenStorage } from '../../../shared/lib/token-storage';

export function useAdminLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminAuthApi.login(email, password),
    onSuccess: (response) => {
      tokenStorage.set(response.accessToken);
      navigate('/');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();

  return () => {
    tokenStorage.clear();
    navigate('/login');
  };
}
