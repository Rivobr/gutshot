import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, type RegisterInput } from '@/shared/api/auth.api';
import { apiErrorMessage } from '@/shared/api/client';
import { useAuth } from '@/app/providers/auth-provider';
import { Logo } from '@/shared/ui/Logo';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consents, setConsents] = useState({ offer: true, rules: true, pdn: true, media: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const input: RegisterInput = {
        nickname: nickname.trim(),
        email: email.trim(),
        password,
        consents,
      };
      const res = await authApi.register(input);
      await signIn(res.accessToken);
      navigate('/app');
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось создать аккаунт'));
    } finally {
      setBusy(false);
    }
  }

  const allChecked = consents.offer && consents.rules && consents.pdn && consents.media;

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
                Вступай
                <br />
                <em>в клуб</em>
              </h1>
              <p className="muted-strong mt-16" style={{ fontSize: 15 }}>
                Почта обязательна — это восстановление доступа. Телефон и Telegram можно привязать
                позже в профиле.
              </p>
            </div>
            <p className="muted" style={{ fontSize: 11 }}>
              18+ · Спортивный покер · Миллионная, 19
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
                Регистрация
              </h2>
              <p className="muted mt-8" style={{ fontSize: 13 }}>
                Меньше минуты — и вы в рейтинге
              </p>
            </div>

            <div className="vip-card" style={{ padding: '26px 22px' }}>
              <form onSubmit={submit}>
                <label className="field">
                  <span>Ник *</span>
                  <input
                    className="input"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Придумайте ник"
                    required
                    minLength={2}
                    maxLength={32}
                  />
                  <span className="hint">Отображается в рейтинге. Один ник — один игрок.</span>
                </label>
                <label className="field">
                  <span>Почта * (обязательно)</span>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mail.ru"
                    required
                  />
                  <span className="hint">Нужна для восстановления пароля.</span>
                </label>
                <label className="field">
                  <span>Пароль *</span>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                    required
                    minLength={8}
                  />
                </label>

                <div className="divider">Согласия</div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={consents.offer}
                    onChange={(e) => setConsents((c) => ({ ...c, offer: e.target.checked }))}
                  />
                  <span>
                    Принимаю <a href="#offer">оферту</a>
                  </span>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={consents.rules}
                    onChange={(e) => setConsents((c) => ({ ...c, rules: e.target.checked }))}
                  />
                  <span>
                    Принимаю <a href="#rules">правила клуба</a>
                  </span>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={consents.pdn}
                    onChange={(e) => setConsents((c) => ({ ...c, pdn: e.target.checked }))}
                  />
                  <span>
                    Согласен с обработкой <a href="#pdn">персональных данных</a>
                  </span>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={consents.media}
                    onChange={(e) => setConsents((c) => ({ ...c, media: e.target.checked }))}
                  />
                  <span>
                    Согласен на <a href="#media">фото- и видеосъёмку</a> на мероприятиях клуба
                  </span>
                </label>

                {error && (
                  <p className="note mt-12" style={{ color: '#d98f85' }}>
                    {error}
                  </p>
                )}
                <button className="btn btn-gold btn-block mt-16" disabled={busy || !allChecked}>
                  Создать аккаунт
                </button>
              </form>
            </div>

            <p className="center muted-strong" style={{ fontSize: 12.5 }}>
              Уже игрок?{' '}
              <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                Войти
              </Link>
            </p>
            <p className="note gold center" style={{ fontSize: 11.5 }}>
              Новичок только с сайта не попадёт в финал месяца,
              <br />
              пока не сыграет первую игру в клубе.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
