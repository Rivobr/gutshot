import { Navigate } from 'react-router-dom';

/** Неизвестный путь (в т.ч. устаревший /t.html) — сразу на главную. */
export function NotFoundPage(): JSX.Element {
  return <Navigate to="/" replace />;
}
