import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/shared/api/auth.api';
import { apiErrorMessage } from '@/shared/api/client';
import { useAuth } from '@/app/providers/auth-provider';
import { Logo } from '@/shared/ui/Logo';

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth?: (
          options: { bot_id: string; request_access?: boolean },
          callback: (user: Record<string, string>) => void,
        ) => void;
      };
    };
    onTelegramAuth?: (user: Record<string, string>) => void;
  }
}

const BOT_USERNAME = (import.meta.env.VITE_TG_BOT_USERNAME as string | undefined) ?? '';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  // Telegram Login Widget: скрипт + callback
  useEffect(() => {
    if (!BOT_USERNAME) return;
    window.onTelegramAuth = (widgetUser) => {
      void (async () => {
        setBusy(true);
        setError('');
        try {
          const res = await authApi.telegramWidget(widgetUser);
          await signIn(res.accessToken);
          navigate('/app');
        } catch (e) {
          setError(apiErrorMessage(e, 'Не удалось войти через Telegram'));
        } finally {
          setBusy(false);
        }
      })();
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '24');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    if (widgetRef.current && !widgetRef.current.hasChildNodes()) {
      widgetRef.current.appendChild(script);
    }
  }, [signIn, navigate]);

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await authApi.login(login.trim(), password);
      await signIn(res.accessToken);
      navigate('/app');
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось войти'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="glow-bg" />
      <div className="auth-wrap">
        <aside className="auth-brand">
          <div className="deco-lines" />
          <div className="auth-hero">
            <Logo />
            <div className="mid">
              <h1 className="serif hero-title" style={{ fontSize: 52 }}>
                Твой стол
                <br />
                <em>ждёт</em>
              </h1>
              <p className="muted-strong mt-16" style={{ fontSize: 15 }}>
                Один аккаунт — один рейтинг и один QR. Ник + пароль + Telegram + почта = один игрок
                GUTSHOT.
              </p>
              <p className="muted mt-24" style={{ fontSize: 12 }}>
                Миллионная, 19 · Санкт-Петербург
              </p>
            </div>
            <p className="muted" style={{ fontSize: 11 }}>
              18+ · Спортивный покер · Оферта · ПДн
            </p>
          </div>
        </aside>

        <main className="auth-main">
          <Logo small />

          <div className="stack-16" style={{ width: '100%', maxWidth: 440 }}>
            <div className="center">
              <h2
                className="serif"
                style={{ fontSize: 30, textTransform: 'uppercase', letterSpacing: '0.03em' }}
              >
                Войти в клуб
              </h2>
              <p className="muted mt-8" style={{ fontSize: 13 }}>
                Вход по нику или через Telegram
              </p>
            </div>

            <div className="vip-card" style={{ padding: '26px 22px' }}>
              <span className="suit-wm" style={{ width: 110, height: 110, fontSize: 110 }}>
                ♠
              </span>

              {/* A) НИК / ПОЧТА + ПАРОЛЬ */}
              <form onSubmit={submitPassword}>
                <p className="eyebrow">Ник и пароль</p>
                <label className="field mt-12">
                  <span>Ник или почта</span>
                  <input
                    className="input"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="Mila_Ace"
                    autoComplete="username"
                    required
                  />
                </label>
                <label className="field">
                  <span>Пароль</span>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <div className="row between mb-16" style={{ fontSize: 12.5 }}>
                  <Link to="/forgot" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                    Забыли пароль?
                  </Link>
                  <Link
                    to="/register"
                    style={{ color: 'var(--muted-strong)', textDecoration: 'none' }}
                  >
                    Регистрация
                  </Link>
                </div>
                {error && (
                  <p className="note mb-16" style={{ color: '#d98f85' }}>
                    {error}
                  </p>
                )}
                <button className="btn btn-gold btn-block" disabled={busy}>
                  Войти
                </button>
              </form>

              <div className="divider">или</div>

              {/* B) TELEGRAM */}
              <div>
                <p className="eyebrow">Через Telegram</p>
                {BOT_USERNAME ? (
                  <div ref={widgetRef} className="mt-12 center" />
                ) : (
                  <button
                    className="btn btn-tg btn-block mt-12"
                    type="button"
                    onClick={() =>
                      setError(
                        'Вход через Telegram появится после привязки: войдите ником и нажмите «Привязать Telegram» в профиле.',
                      )
                    }
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M9.04 15.31l-.37 4.02c.53 0 .76-.23 1.04-.5l2.5-2.39 5.18 3.79c.95.53 1.63.25 1.88-.87L23.9 3.86c.31-1.4-.51-1.95-1.44-1.6L2.4 9.72c-1.36.53-1.34 1.29-.23 1.63l4.69 1.46L17.62 5.7c.51-.34.98-.15.6.19L9.04 15.31z" />
                    </svg>
                    Продолжить с Telegram
                  </button>
                )}
                <p className="hint">
                  Работает, если Telegram уже привязан к игроку.
                  <br />
                  Не привязан? Войдите ником и паролем и привяжите Telegram в профиле — второй игрок
                  не создаётся.
                </p>
              </div>
            </div>

            <p className="center muted" style={{ fontSize: 11.5 }}>
              Регистрируясь, вы принимаете оферту, правила клуба,
              <br />
              политику ПДн и согласие на фото- и видеосъёмку.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
