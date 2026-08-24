import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/shared/api/auth.api';
import { apiErrorMessage } from '@/shared/api/client';
import { Logo } from '@/shared/ui/Logo';

export function ResetPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authApi.reset(token, password);
      setDone(true);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось сменить пароль'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 20px 48px',
      }}
    >
      <div className="glow-bg" />
      <Logo />

      <div className="stack-16" style={{ width: '100%', maxWidth: 430 }}>
        <div className="vip-card" style={{ padding: '26px 22px' }}>
          <h2
            className="serif"
            style={{ fontSize: 24, textTransform: 'uppercase', letterSpacing: '0.03em' }}
          >
            Новый пароль
          </h2>
          {done ? (
            <>
              <p className="muted mt-8 mb-16" style={{ fontSize: 13 }}>
                Пароль обновлён. Теперь войдите с новым паролем.
              </p>
              <Link className="btn btn-gold btn-block" to="/login">
                Войти
              </Link>
            </>
          ) : !token ? (
            <>
              <p className="note mt-12">
                Ссылка недействительна: в ней нет токена. Запросите письмо заново.
              </p>
              <Link className="btn btn-ghost btn-block mt-16" to="/forgot">
                Запросить сброс
              </Link>
            </>
          ) : (
            <form onSubmit={submit}>
              <label className="field mt-12">
                <span>Новый пароль</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  required
                  minLength={8}
                  autoFocus
                />
              </label>
              {error && (
                <p className="note mb-12" style={{ color: '#d98f85' }}>
                  {error}
                </p>
              )}
              <button className="btn btn-gold btn-block" disabled={busy || password.length < 8}>
                {busy ? 'Сохраняем…' : 'Сменить пароль'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
