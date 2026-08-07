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
import { playerApi, useBootstrap } from '../entities/player';
import { tournamentApi } from '../entities/tournament/api/tournament.api';
import { EmptyState, Button } from '@gutshot/ui';
import { clearReauthFlag } from '../shared/api/client';
import { tokenStorage } from '../shared/lib/token-storage';
import { getTelegramInitData } from '../shared/lib/telegram';
import { SplashScreen } from '../widgets/SplashScreen/SplashScreen';
import { ToastHost } from '../shared/ui/toast';

/** Bootstrap должен отвечать за сотни мс; 6с — жёсткий потолок. */
const BOOTSTRAP_WAIT_MS = 6_000;

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
      <ToastHost />
      <ConsentGate>
        <RouterProvider router={router} />
      </ConsentGate>
    </QueryProvider>
  );
}

function ConsentGate({ children }: { children: JSX.Element }): JSX.Element {
  const queryClient = useQueryClient();
  const { data: boot, isPending, isError, refetch } = useBootstrap();
  const [timedOut, setTimedOut] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const recoveryTried = useRef(false);
  const waitStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (boot) {
      waitStartedAt.current = null;
      return;
    }
    if (!isPending && !recovering) {
      return;
    }
    if (waitStartedAt.current == null) {
      waitStartedAt.current = Date.now();
    }
    const remaining = BOOTSTRAP_WAIT_MS - (Date.now() - waitStartedAt.current);
    if (remaining <= 0) {
      setTimedOut(true);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), remaining);
    return () => window.clearTimeout(timer);
  }, [boot, isPending, recovering]);

  useEffect(() => {
    if (boot?.id) {
      clearReauthFlag();
    }
  }, [boot?.id]);

  // После успешного boot — тяжёлый профиль и nearest в фоне, не блокируя UI.
  useEffect(() => {
    if (!boot?.consentAcceptedAt) {
      return;
    }
    void queryClient.prefetchQuery({
      queryKey: ['tournaments', 'nearest'],
      queryFn: tournamentApi.getNearest,
      staleTime: 30_000,
    });
    void queryClient.prefetchQuery({
      queryKey: ['profile'],
      queryFn: playerApi.getProfile,
      staleTime: 60_000,
    });
  }, [boot?.consentAcceptedAt, queryClient]);

  useEffect(() => {
    if (!isError || boot || recoveryTried.current) {
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
  }, [isError, boot, refetch]);

  if ((isPending || recovering) && !timedOut) {
    return <SplashScreen subtitle="Открываем клуб…" />;
  }

  if (isError || !boot || timedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <EmptyState
          icon="⚠️"
          title="Не удалось открыть клуб"
          description="Сессия могла устареть или сервер не ответил. Нажмите «Повторить»."
        />
        <Button
          onClick={() => {
            void (async () => {
              setTimedOut(false);
              setRecovering(true);
              recoveryTried.current = false;
              waitStartedAt.current = null;
              try {
                tokenStorage.clear();
                clearReauthFlag();
                const initData = getTelegramInitData() || (await waitForInitData(3_000));
                if (initData) {
                  await loginWithTelegramInitData(initData);
                }
                await refetch();
              } catch {
                tokenStorage.clear();
                clearReauthFlag();
                window.location.reload();
              } finally {
                setRecovering(false);
              }
            })();
          }}
        >
          Повторить
        </Button>
      </div>
    );
  }

  if (!boot.consentAcceptedAt) {
    return <ConsentScreen />;
  }

  return children;
}
