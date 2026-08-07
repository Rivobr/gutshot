import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
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

/**
 * Потолок ожидания входа. Должен быть больше таймаута самого запроса (8с),
 * иначе на медленной сети показываем ошибку, пока ответ ещё идёт.
 */
const BOOTSTRAP_WAIT_MS = 10_000;

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

/** Текст ошибки от сервера — иначе всё сводится к общей фразе. */
function serverMessage(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null;
  }
  const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  return null;
}

function ConsentGate({ children }: { children: JSX.Element }): JSX.Element {
  const queryClient = useQueryClient();
  const { data: boot, isPending, isError, error, refetch } = useBootstrap();
  const [timedOut, setTimedOut] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const recoveryTried = useRef(false);
  const waitStartedAt = useRef<number | null>(null);

  const isBlocked = isAxiosError(error) && error.response?.status === 403;
  const blockedMessage = isBlocked
    ? (serverMessage(error) ?? 'Аккаунт заблокирован. Обратитесь к администратору клуба.')
    : null;
  const errorDescription =
    serverMessage(error) ?? 'Сессия могла устареть или сервер не ответил. Нажмите «Повторить».';

  useEffect(() => {
    if (boot) {
      // Ответ мог прийти уже после срабатывания таймера — тогда ошибку не показываем.
      waitStartedAt.current = null;
      setTimedOut(false);
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
    // Заблокированного перелогин не спасёт — не дёргаем сервер зря.
    if (!isError || boot || recoveryTried.current || isBlocked) {
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
  }, [isError, boot, isBlocked, refetch]);

  if (blockedMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <EmptyState icon="🚫" title="Доступ закрыт" description={blockedMessage} />
      </div>
    );
  }

  if ((isPending || recovering) && !timedOut) {
    return <SplashScreen subtitle="Открываем клуб…" />;
  }

  if (isError || !boot || timedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <EmptyState icon="⚠️" title="Не удалось открыть клуб" description={errorDescription} />
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
