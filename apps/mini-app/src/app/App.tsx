import { useEffect, useRef, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from './providers/query-provider';
import { router } from './router/router';
import {
  loginWithTelegramInitData,
  useStartup,
  waitForInitData,
} from '../processes/startup/use-startup';
import { ConsentScreen } from '../pages/Onboarding/ConsentScreen';
import { useProfile } from '../entities/player';
import { tournamentApi } from '../entities/tournament/api/tournament.api';
import { EmptyState, Button } from '@gutshot/ui';
import { clearReauthFlag } from '../shared/api/client';
import { tokenStorage } from '../shared/lib/token-storage';
import { getTelegramInitData } from '../shared/lib/telegram';
import { SplashScreen } from '../widgets/SplashScreen/SplashScreen';

const PROFILE_WAIT_MS = 6_000;

export function App(): JSX.Element {
  const { status, errorMessage } = useStartup();

  if (status === 'loading') {
    return <SplashScreen subtitle="Открываем клуб…" />;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <EmptyState icon="⚠️" title="Ошибка авторизации" description={errorMessage} />
        <Button
          onClick={() => {
            tokenStorage.clear();
            clearReauthFlag();
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

function ConsentGate({ children }: { children: JSX.Element }): JSX.Element {
  const queryClient = useQueryClient();
  const { data: profile, isPending, isError, isFetching, refetch } = useProfile();
  const [timedOut, setTimedOut] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const recoveryTried = useRef(false);

  useEffect(() => {
    if (!isPending && !isFetching && !recovering) {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), PROFILE_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [isPending, isFetching, recovering]);

  useEffect(() => {
    if (profile?.id) {
      clearReauthFlag();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.consentAcceptedAt) {
      return;
    }
    void queryClient.prefetchQuery({
      queryKey: ['tournaments', 'nearest'],
      queryFn: tournamentApi.getNearest,
      staleTime: 30_000,
    });
  }, [profile?.consentAcceptedAt, queryClient]);

  // Один тихий recovery без reload: перелогин по initData + повтор профиля.
  useEffect(() => {
    if (!isError || profile || recoveryTried.current) {
      return;
    }
    recoveryTried.current = true;
    setRecovering(true);

    void (async () => {
      try {
        const initData = getTelegramInitData() || (await waitForInitData(1_500));
        if (!initData) {
          return;
        }
        await loginWithTelegramInitData(initData);
        await refetch();
      } catch {
        // UI покажет кнопку «Повторить»
      } finally {
        setRecovering(false);
      }
    })();
  }, [isError, profile, refetch]);

  if ((isPending || recovering) && !timedOut) {
    return <SplashScreen subtitle="Загружаем профиль…" />;
  }

  if (isError || !profile || timedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <EmptyState
          icon="⚠️"
          title="Не удалось загрузить профиль"
          description="Сессия могла устареть или сервер не ответил. Нажмите «Повторить»."
        />
        <Button
          onClick={() => {
            tokenStorage.clear();
            clearReauthFlag();
            window.location.reload();
          }}
        >
          Повторить
        </Button>
      </div>
    );
  }

  if (!profile.consentAcceptedAt) {
    return <ConsentScreen />;
  }

  return children;
}
