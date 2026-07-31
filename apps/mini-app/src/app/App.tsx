import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/query-provider';
import { router } from './router/router';
import { useStartup } from '../processes/startup/use-startup';
import { ConsentScreen } from '../pages/Onboarding/ConsentScreen';
import { useProfile } from '../entities/player';
import { Loader, EmptyState, Button } from '@gutshot/ui';
import { tokenStorage } from '../shared/lib/token-storage';

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <EmptyState icon="⚠️" title="Ошибка авторизации" description={errorMessage} />
        <Button
          onClick={() => {
            tokenStorage.clear();
            window.location.reload();
          }}
        >
          Попробовать снова
        </Button>
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
  const { data: profile, isPending, isError, refetch } = useProfile();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <EmptyState
          icon="⚠️"
          title="Не удалось загрузить профиль"
          description="Проверьте соединение и попробуйте снова"
        />
        <Button onClick={() => void refetch()}>Повторить</Button>
      </div>
    );
  }

  if (!profile.consentAcceptedAt) {
    return <ConsentScreen />;
  }

  return children;
}
