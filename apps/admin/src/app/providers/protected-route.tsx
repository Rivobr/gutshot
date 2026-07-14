import { Navigate, Outlet } from 'react-router-dom';
import { tokenStorage } from '../../shared/lib/token-storage';

export function ProtectedRoute(): JSX.Element {
  const token = tokenStorage.get();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
