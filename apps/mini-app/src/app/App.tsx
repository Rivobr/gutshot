import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/query-provider';
import { router } from './router/router';
import { useStartup } from '../processes/startup/use-startup';
import { ConsentScreen } from '../pages/Onboarding/ConsentScreen';
import { useProfile } from '../entities/player';
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
      <ConsentGate>
        <RouterProvider router={router} />
      </ConsentGate>
    </QueryProvider>
  );
}

/**
 * Приветственный экран показывается, пока игрок не принял соглашения.
 * Факт принятия хранится в БД, поэтому экран не появляется повторно
 * на других устройствах — и появляется снова, если админ сбросил согласие.
 */
function ConsentGate({ children }: { children: JSX.Element }): JSX.Element {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (profile && !profile.consentAcceptedAt) {
    return <ConsentScreen />;
  }

  return children;
}
