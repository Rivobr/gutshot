import { NavLink } from 'react-router-dom';

type NavId = 'home' | 'tournaments' | 'myTournament' | 'rating' | 'profile';

const NAV_ITEMS: { to: string; label: string; id: NavId }[] = [
  { to: '/', label: 'Главная', id: 'home' },
  { to: '/tournaments', label: 'Турниры', id: 'tournaments' },
  { to: '/my-tournament', label: 'Мой турнир', id: 'myTournament' },
  { to: '/rating', label: 'Рейтинг', id: 'rating' },
  { to: '/profile', label: 'Профиль', id: 'profile' },
];

function NavIcon({ id, active }: { id: NavId; active: boolean }): JSX.Element {
  const c = active ? 'url(#navGrad)' : '#3E3428';
  const w = 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'nav-active-glow' : ''}>
      <defs>
        <linearGradient id="navGrad" x1="0" y1="0" x2="24" y2="24">
          <stop stopColor="#9C6A1F" />
          <stop offset="0.5" stopColor="#F7D98A" />
          <stop offset="1" stopColor="#9C6A1F" />
        </linearGradient>
      </defs>
      {id === 'home' && (
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          fill={active ? 'url(#navGrad)' : 'none'}
          stroke={active ? 'none' : c}
          strokeWidth={w}
        />
      )}
      {id === 'tournaments' && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth={w} fill="none" />
          <line x1="3" y1="9" x2="21" y2="9" stroke={c} strokeWidth={w} />
          <line x1="8" y1="2" x2="8" y2="6" stroke={c} strokeWidth={w} strokeLinecap="round" />
          <line x1="16" y1="2" x2="16" y2="6" stroke={c} strokeWidth={w} strokeLinecap="round" />
          {active && <rect x="7" y="13" width="3" height="3" rx="0.5" fill="url(#navGrad)" />}
        </>
      )}
      {id === 'rating' && (
        <>
          <rect x="2" y="14" width="5" height="8" rx="1" fill={active ? 'url(#navGrad)' : 'none'} stroke={active ? 'none' : c} strokeWidth={w} />
          <rect x="9.5" y="9" width="5" height="13" rx="1" fill={active ? 'url(#navGrad)' : 'none'} stroke={active ? 'none' : c} strokeWidth={w} />
          <rect x="17" y="4" width="5" height="18" rx="1" fill={active ? 'url(#navGrad)' : 'none'} stroke={active ? 'none' : c} strokeWidth={w} />
        </>
      )}
      {id === 'myTournament' && (
        <path
          d="M12 2L15.5 9L23 10.3L17.5 15.6L18.9 23L12 19.3L5.1 23L6.5 15.6L1 10.3L8.5 9L12 2Z"
          fill={active ? 'url(#navGrad)' : 'none'}
          stroke={active ? 'none' : c}
          strokeWidth={w}
        />
      )}
      {id === 'profile' && (
        <>
          <circle cx="12" cy="8" r="4" stroke={c} strokeWidth={w} fill="none" />
          <path d="M4 20C4 17 7.6 15 12 15C16.4 15 20 17 20 20" stroke={c} strokeWidth={w} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function BottomNavigation(): JSX.Element {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex items-center justify-around px-1"
      style={{
        maxWidth: 430,
        height: 68,
        background: 'rgba(9,9,9,0.97)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(199,154,61,0.15)',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className="flex flex-col items-center gap-1 py-2 px-2" style={{ minWidth: 52 }}>
          {({ isActive }) => (
            <>
              <NavIcon id={item.id} active={isActive} />
              <span
                className="sans"
                style={{
                  fontSize: 9,
                  color: isActive ? '#C89A3D' : '#3E3428',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
