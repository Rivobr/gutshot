import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet, apiErrorMessage } from '@/shared/api/client';
import type { PlayerProfileDto } from '@gutshot/types';
import { authApi } from '@/shared/api/auth.api';
import { ratingApi } from '@/shared/api/public.api';
import { useAuth } from '@/app/providers/auth-provider';
import { useInstallPrompt } from '@/shared/hooks/use-install-prompt';
import { formatDateShort } from '@/shared/lib/format';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { canPrompt, promptInstall, installed, isIos } = useInstallPrompt();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<PlayerProfileDto>('/profile'),
  });

  const [linkCode, setLinkCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');

  async function makeLinkCode() {
    setLinkError('');
    try {
      const res = await authApi.telegramLinkCode();
      setLinkCode(res.code);
    } catch (e) {
      setLinkError(apiErrorMessage(e, 'Не удалось получить код'));
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setPwMessage('');
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwMessage('✓ Пароль изменён');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      setPwMessage(apiErrorMessage(e, 'Не удалось сменить пароль'));
    }
  }

  if (!user) return null;

  const name = profile?.nickname ?? user.nickname ?? 'Игрок';

  return (
    <div className="stack-16">
      <h1 className="serif" style={{ fontSize: 26, textTransform: 'uppercase' }}>
        Профиль
      </h1>

      <div className="cols-p">
        <article className="vip-card" style={{ padding: 24 }}>
          <span className="suit-wm">♥</span>
          <div className="row" style={{ gap: 16 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {user.photoUrl ? <img src={user.photoUrl} alt="" /> : name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: 22 }}>
                {name}
              </h2>
              <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Уровень {profile?.level ?? 1} · с{' '}
                {profile ? formatDateShort(profile.memberSince) : '—'}
              </p>
            </div>
          </div>
          <div className="mt-16">
            <div className="row between mb-8">
              <span className="muted" style={{ fontSize: 12 }}>
                {profile?.currentLevelXp ?? 0} / {profile?.nextLevelXp ?? 0} XP
              </span>
              <b className="num" style={{ color: 'var(--gold)' }}>
                {profile?.progress ?? 0}%
              </b>
            </div>
            <div className="xp-bar">
              <i style={{ width: `${profile?.progress ?? 0}%` }} />
            </div>
          </div>
        </article>

        <GlobalRatingCard currentUserId={user.id} />

        <section className="card">
          <p className="eyebrow">Вход и привязки · один игрок = один аккаунт</p>

          <div className="link-row">
            <div className="link-ic">🔑</div>
            <div className="link-body">
              <b>Пароль</b>
              <span>Вход по нику / почте / телефону</span>
            </div>
            <button className="btn btn-dark btn-sm" onClick={() => setPwOpen((v) => !v)}>
              Сменить
            </button>
          </div>
          {pwOpen && (
            <form onSubmit={changePassword} className="stack-16 mt-8 mb-16">
              <input
                className="input"
                type="password"
                placeholder="Текущий пароль"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Новый пароль (мин. 8)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              {pwMessage && <p className="hint">{pwMessage}</p>}
              <button className="btn btn-gold btn-sm">Сохранить пароль</button>
            </form>
          )}

          <div className="link-row">
            <div
              className={`link-ic ${user.telegramId && !user.telegramId.startsWith('web:') ? 'pill-ok' : ''}`}
              style={{ borderRadius: 12 }}
            >
              ✈
            </div>
            <div className="link-body">
              <b>Telegram</b>
              <span>
                {user.telegramId && !user.telegramId.startsWith('web:')
                  ? 'Привязан — вход одной кнопкой'
                  : 'Не привязан — получите код и отправьте боту'}
              </span>
            </div>
            {(!user.telegramId || user.telegramId.startsWith('web:')) && (
              <button className="btn btn-gold btn-sm" onClick={makeLinkCode}>
                Привязать
              </button>
            )}
          </div>
          {linkCode && (
            <div className="card-flat mt-8" style={{ padding: '12px 14px' }}>
              <p style={{ fontSize: 12.5, margin: 0 }}>
                Отправьте боту <b style={{ color: 'var(--gold)' }}>/link {linkCode}</b>
              </p>
              <button
                className="btn btn-ghost btn-sm mt-8"
                onClick={() => void navigator.clipboard.writeText(`/link ${linkCode}`)}
              >
                Скопировать команду
              </button>
            </div>
          )}
          {linkError && (
            <p className="note mt-8" style={{ color: '#d98f85' }}>
              {linkError}
            </p>
          )}

          <div className="link-row">
            <div
              className={`link-ic ${profile?.qrCode ? 'pill-ok' : ''}`}
              style={{ borderRadius: 12 }}
            >
              ✉
            </div>
            <div className="link-body">
              <b>Почта</b>
              <span>Восстановление пароля</span>
            </div>
          </div>
          <div className="link-row">
            <div className="link-ic" style={{ borderRadius: 12 }}>
              ▦
            </div>
            <div className="link-body">
              <b>Личный QR</b>
              <span>Постоянный код входа в клуб</span>
            </div>
            <Link className="btn btn-dark btn-sm" to="/app/qr">
              Открыть
            </Link>
          </div>
        </section>

        <section className="card stack-16">
          <p className="eyebrow">Приложение клуба</p>
          <b style={{ fontSize: 15 }}>GUTSHOT на экране Домой</b>
          <p className="muted-strong" style={{ fontSize: 13 }}>
            Полноэкранный режим без адресной строки, тёмная тема, быстрый запуск.
          </p>
          {canPrompt ? (
            <button className="btn btn-gold btn-sm" onClick={() => void promptInstall()}>
              ＋ Добавить на экран
            </button>
          ) : (
            <div className="row wrap">
              <Link className="btn btn-gold btn-sm" to="/install">
                {isIos ? 'Инструкция для iPhone' : 'Как установить'}
              </Link>
            </div>
          )}
          {installed && <p className="hint">✓ Приложение установлено</p>}
          <p className="hint">
            На Android появится системный диалог. На iPhone Safari ставится через «Поделиться → На
            экран Домой».
          </p>
        </section>

        <section className="card">
          <div className="link-row">
            <div className="link-ic" style={{ borderRadius: 12 }}>
              ↗
            </div>
            <div className="link-body">
              <b>Как найти клуб</b>
              <span>Миллионная, 19 · маршрут</span>
            </div>
            <a
              className="btn btn-dark btn-sm"
              href="https://yandex.ru/maps/?text=Санкт-Петербург, Миллионная 19"
              target="_blank"
              rel="noreferrer"
            >
              Карта
            </a>
          </div>
          <div className="link-row">
            <div className="link-ic" style={{ borderRadius: 12 }}>
              ?
            </div>
            <div className="link-body">
              <b>Поддержка</b>
              <span>@gutshot_suport · +7 999 009-11-99</span>
            </div>
          </div>
          <button
            className="btn btn-dark btn-block mt-16"
            style={{ color: '#d98f85', borderColor: 'rgba(192, 57, 43, 0.35)' }}
            onClick={() => {
              signOut();
              window.location.href = '/';
            }}
          >
            Выйти из аккаунта
          </button>
        </section>
      </div>
    </div>
  );
}

/** Глобальный рейтинг по XP — как в боте: место игрока + топ-5. */
function GlobalRatingCard({ currentUserId }: { currentUserId?: string }) {
  const { data } = useQuery({ queryKey: ['rating-overall'], queryFn: ratingApi.overall });
  const entries = data ?? [];
  const mine = entries.find((e) => e.userId === currentUserId);
  const preview = entries.slice(0, 5);

  return (
    <section className="card">
      <div className="row between mb-16">
        <b className="serif" style={{ fontSize: 17 }}>
          Глобальный рейтинг
        </b>
        <span className="chip">топ по XP</span>
      </div>
      {mine ? (
        <div className="row between mb-16" style={{ fontSize: 13 }}>
          <span className="muted">Ваше место</span>
          <b className="num" style={{ color: 'var(--gold)' }}>
            #{mine.rank} · {mine.points.toLocaleString('ru-RU')} XP
          </b>
        </div>
      ) : null}
      {entries.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>
          Рейтинг пока пуст
        </p>
      ) : (
        <table className="tbl">
          <tbody>
            {preview.map((e) => (
              <tr
                key={e.userId}
                style={
                  e.userId === currentUserId
                    ? { background: 'rgba(200, 154, 61, 0.12)', borderRadius: 10 }
                    : undefined
                }
              >
                <td className="rank">{e.rank}</td>
                <td>
                  {e.nickname ?? [e.firstName, e.lastName].filter(Boolean).join(' ') ?? 'Игрок'}
                </td>
                <td className="r num">
                  <span className="muted" style={{ fontSize: 11 }}>
                    Ур. {e.level ?? '—'}
                  </span>{' '}
                  <b>{e.points.toLocaleString('ru-RU')}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="hint mt-12">XP за явку, комбо и уровни. Очки недельного рейтинга — отдельно.</p>
    </section>
  );
}
