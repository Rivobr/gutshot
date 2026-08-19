import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { adminSession } from '../../shared/lib/admin-session';
import { tokenStorage } from '../../shared/lib/token-storage';

const DEALER_ALLOWED = new Set(['/scanner']);

export function ProtectedRoute(): JSX.Element {
  const token = tokenStorage.get();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminSession.isDealer() && !DEALER_ALLOWED.has(location.pathname)) {
    return <Navigate to="/scanner" replace />;
  }

  return <Outlet />;
}
