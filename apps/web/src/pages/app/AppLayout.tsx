import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '@/shared/ui/Logo';
import { useAuth } from '@/app/providers/auth-provider';
import { displayName } from '@/shared/lib/format';

const NAV = [
  { to: '/app', label: 'Главная', ic: '⌂', end: true },
  { to: '/app/rating', label: 'Рейтинг', ic: '✦' },
  { to: '/app/qr', label: 'QR', ic: '▦' },
  { to: '/app/profile', label: 'Профиль', ic: '◉' },
];

const SIDE_NAV = [
  ...NAV.slice(0, 1),
  { to: '/app/rating', label: 'Рейтинг', ic: '✦' },
  { to: '/app/qr', label: 'Мой QR', ic: '⌖' },
  { to: '/app/profile', label: 'Профиль', ic: '◉' },
  { to: '/install', label: 'Поставить приложение', ic: '＋' },
];

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const name = displayName(user);

  return (
    <div className="shell-app" style={{ minHeight: '100dvh' }}>
      <div className="glow-bg" />

      <aside className="sidebar">
        <div className="mb-24">
          <Logo small />
        </div>
        <nav className="side-nav">
          {SIDE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="ic">{item.ic}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          Миллионная, 19 · СПб
          <br />
          +7 999 009-11-99
          <br />
          <br />
          Очки рейтинга ≠ XP
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="who">
            <div className="avatar">
              {user.photoUrl ? <img src={user.photoUrl} alt="" /> : name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              {name}
              <br />
              <span className="muted">{user.xp ?? 0} XP</span>
            </div>
          </div>
          <div className="row">
            <button className="btn btn-dark btn-sm" onClick={() => navigate('/app/profile')}>
              Профиль
            </button>
            <button
              className="btn btn-gold btn-sm"
              onClick={() => {
                signOut();
                navigate('/');
              }}
            >
              Выйти
            </button>
          </div>
        </header>

        <Outlet />
      </main>

      <nav className="bottom-nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="ic">{item.ic}</span> {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
