import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tournamentsApi } from '@/shared/api/public.api';
import { apiGet } from '@/shared/api/client';
import type { PlayerProfileDto } from '@gutshot/types';
import { formatDateShort, formatTime } from '@/shared/lib/format';
import { useAuth } from '@/app/providers/auth-provider';

export function CabinetHomePage() {
  const { user } = useAuth();
  const { data: nearest } = useQuery({ queryKey: ['nearest'], queryFn: tournamentsApi.nearest });
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<PlayerProfileDto>('/profile'),
  });

  const taken = nearest?._count?.registrations ?? 0;
  const max = nearest?.maxPlayers ?? 40;
  const seated = Math.min(taken, max);
  const waiting = Math.max(taken - max, 0);

  return (
    <div className="stack-16">
      <h1 className="serif" style={{ fontSize: 26, textTransform: 'uppercase' }}>
        Главная
      </h1>

      <div className="grid-cab">
        <article className="vip-card span-2" style={{ padding: 24 }}>
          <span className="suit-wm">♠</span>
          <div className="row between wrap mb-16">
            <span className="chip chip-live">● СКОРО</span>
            {nearest && (
              <span className="chip">
                🕐 {formatDateShort(nearest.date)} / {formatTime(nearest.date)}
              </span>
            )}
            <span className="chip">Миллионная, 19</span>
          </div>
          <p className="eyebrow">Ближайший турнир</p>
          <h2 className="serif" style={{ fontSize: 26, marginTop: 6, textTransform: 'uppercase' }}>
            {nearest?.title ?? 'Скоро объявим'}
          </h2>
          <div className="mt-16" style={{ maxWidth: 420 }}>
            <div className="row between mb-8">
              <span className="muted">Мест занято</span>
              <b className="num">
                {seated} / {max}
              </b>
            </div>
            <div className="xp-bar">
              <i style={{ width: `${Math.min(100, Math.round((seated / max) * 100))}%` }} />
            </div>
            {waiting > 0 && (
              <p className="hint mt-8" style={{ color: 'var(--gold)' }}>
                +{waiting} в листе ожидания
              </p>
            )}
          </div>
          <div className="row wrap mt-24">
            <Link
              className="btn btn-gold"
              to={nearest ? `/app/tournaments/${nearest.id}` : '/app/rating'}
            >
              Детали и запись
            </Link>
            <Link className="btn btn-ghost" to="/app/qr">
              Мой QR на вход
            </Link>
          </div>
        </article>

        <div className="card stack-16">
          <p className="eyebrow">Ваш прогресс</p>
          <div className="row between">
            <div>
              <b className="serif" style={{ fontSize: 30 }}>
                {profile?.level ?? 1}
              </b>
              <br />
              <span className="muted" style={{ fontSize: 11 }}>
                уровень
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <b className="num" style={{ fontSize: 22, color: 'var(--gold)' }}>
                {profile?.xp ?? user?.xp ?? 0}
              </b>{' '}
              <span className="muted" style={{ fontSize: 11 }}>
                XP
              </span>
            </div>
          </div>
          <div className="xp-bar">
            <i style={{ width: `${profile?.progress ?? 0}%` }} />
          </div>
          <p className="hint">
            {profile
              ? `До ${profile.level + 1} уровня: ${Math.max(0, profile.nextLevelXp - profile.currentLevelXp)} XP`
              : 'Загружаем…'}
          </p>
          <div className="divider" style={{ margin: '14px 0' }} />
          <div className="row between">
            <span className="muted">В клубе с</span>
            <b style={{ fontSize: 12.5 }}>{profile ? formatDateShort(profile.memberSince) : '—'}</b>
          </div>
          <p className="hint">Очки рейтинга ≠ XP. Баунти = 50 очков.</p>
        </div>

        <div className="card span-2">
          <div className="row between wrap mb-16">
            <b className="serif" style={{ fontSize: 16 }}>
              Сетка недели
            </b>
            <span className="chip">неделя пн–сб</span>
          </div>
          <div className="week-grid" style={{ gap: 10 }}>
            <div className="day hot">
              <b>СР</b>
              <span>19:00 · фриролл</span>
            </div>
            <div className="day hot">
              <b>ПТ</b>
              <span>19:00 · фриролл</span>
            </div>
            <div className="day hot">
              <b>СБ</b>
              <span>17:00 · баунти фриролл</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
