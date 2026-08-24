import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/shared/api/auth.api';
import { Logo } from '@/shared/ui/Logo';

export function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await authApi.forgot(email.trim());
      setSent(true);
    } catch {
      // Не раскрываем существование аккаунта — всегда показываем «отправлено».
      setSent(true);
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
            Забыли пароль?
          </h2>
          <p className="muted mt-8 mb-16" style={{ fontSize: 13 }}>
            Пришлём ссылку для сброса. Она работает 30 минут и одноразовая.
          </p>
          <form onSubmit={submit}>
            <label className="field">
              <span>Почта аккаунта</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mail.ru"
                required
              />
            </label>
            {sent ? (
              <div className="card-flat" style={{ padding: '14px 16px' }}>
                <b style={{ fontSize: 13.5 }}>✉ Письмо отправлено — {email}</b>
                <p className="hint mt-8">
                  Проверьте почту: ссылка действует 30 минут и срабатывает один раз.
                </p>
              </div>
            ) : (
              <button className="btn btn-gold btn-block" disabled={busy || !email}>
                {busy ? 'Отправляем…' : 'Отправить письмо'}
              </button>
            )}
            {sent && (
              <button
                type="button"
                className="btn btn-ghost btn-block mt-12 btn-sm"
                onClick={() => setSent(false)}
              >
                Отправить ещё раз
              </button>
            )}
            <Link className="btn btn-dark btn-block mt-12" to="/login">
              Назад ко входу
            </Link>
          </form>
        </div>

        {apiErrorNote()}
      </div>
    </main>
  );
}

function apiErrorNote() {
  return (
    <div className="note">
      Нет почты в аккаунте? Добавьте её в профиле или напишите нам в Telegram:{' '}
      <a
        href="https://t.me/gutshot_suport"
        style={{ color: 'var(--gold)', textDecoration: 'none' }}
      >
        @gutshot_suport
      </a>{' '}
      — поможем восстановить доступ.
    </div>
  );
}
