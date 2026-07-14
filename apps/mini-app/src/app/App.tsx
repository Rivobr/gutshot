import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/query-provider';
import { router } from './router/router';
import { useStartup } from '../processes/startup/use-startup';
import { Loader, EmptyState } from '@gutshot/ui';

export function App(): JSX.Element {
  const { status, errorMessage } = useStartup();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <EmptyState icon="⚠️" title="Ошибка авторизации" description={errorMessage} />
      </div>
    );
  }

  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}
