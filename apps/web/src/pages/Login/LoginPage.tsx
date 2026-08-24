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

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

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

  async function sendCode() {
    setPhoneError('');
    setBusy(true);
    try {
      await authApi.phoneRequestCode(phone);
      setCodeSent(true);
      setResendIn(60);
    } catch (e) {
      setPhoneError(apiErrorMessage(e, 'Не удалось отправить код'));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setPhoneError('');
    setBusy(true);
    try {
      const res = await authApi.phoneVerify(phone, code);
      await signIn(res.accessToken);
      navigate('/app');
    } catch (e) {
      setPhoneError(apiErrorMessage(e, 'Не удалось подтвердить код'));
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
                Один аккаунт — один рейтинг и один QR. Ник + пароль + телефон + Telegram + почта =
                один игрок GUTSHOT.
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
                Три способа — выберите любой
              </p>
            </div>

            <div className="vip-card" style={{ padding: '26px 22px' }}>
              <span className="suit-wm" style={{ width: 110, height: 110, fontSize: 110 }}>
                ♠
              </span>

              {/* A) НИК / ПОЧТА / ТЕЛЕФОН + ПАРОЛЬ */}
              <form onSubmit={submitPassword}>
                <p className="eyebrow">A · Ник и пароль</p>
                <label className="field mt-12">
                  <span>Ник, почта или телефон</span>
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

              {/* B) ТЕЛЕФОН + КОД */}
              <div>
                <p className="eyebrow">B · Телефон + код</p>
                {!codeSent ? (
                  <>
                    <div className="row mt-12" style={{ gap: 8 }}>
                      <span className="chip" style={{ height: 52, borderRadius: 14 }}>
                        RU +7
                      </span>
                      <input
                        className="input"
                        style={{ flex: 1 }}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="999 000-00-00"
                        inputMode="tel"
                      />
                    </div>
                    <button
                      className="btn btn-ghost btn-block mt-12"
                      onClick={sendCode}
                      disabled={busy || phone.length < 10}
                    >
                      Получить код
                    </button>
                  </>
                ) : (
                  <form onSubmit={verifyCode}>
                    <div className="row mt-12" style={{ gap: 8 }}>
                      <input
                        className="input num"
                        style={{ flex: 1, letterSpacing: '0.4em', textAlign: 'center' }}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="• • • • • •"
                        inputMode="numeric"
                        autoFocus
                      />
                    </div>
                    <button
                      className="btn btn-gold btn-block mt-12"
                      disabled={busy || code.length < 4}
                    >
                      Подтвердить
                    </button>
                    <button
                      type="button"
                      className="btn btn-dark btn-block mt-8 btn-sm"
                      onClick={sendCode}
                      disabled={resendIn > 0 || busy}
                    >
                      {resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код снова'}
                    </button>
                  </form>
                )}
                <p className="hint">
                  Код из 4–6 цифр придёт в SMS · действует 5 минут · повтор — раз в 60 секунд.
                  <br />
                  Нет аккаунта? Создадим и попросим ник. Один номер — один игрок.
                </p>
                {phoneError && (
                  <p className="note mt-8" style={{ color: '#d98f85' }}>
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="divider">или</div>

              {/* C) TELEGRAM */}
              <div>
                <p className="eyebrow">C · Через Telegram</p>
                {BOT_USERNAME ? (
                  <div ref={widgetRef} className="mt-12 center" />
                ) : (
                  <button
                    className="btn btn-tg btn-block mt-12"
                    type="button"
                    onClick={() =>
                      setError(
                        'Вход через Telegram появится после привязки: войдите ником/телефоном и нажмите «Привязать Telegram» в профиле.',
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
                  Не привязан? Войдите ником или телефоном и привяжите Telegram в профиле — второй
                  игрок не создаётся.
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
