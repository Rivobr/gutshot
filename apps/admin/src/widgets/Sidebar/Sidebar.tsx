import { NavLink } from 'react-router-dom';
import { cn } from '@gutshot/ui';
import { useLogout } from '../../features/auth/model/use-auth';

const ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/tournaments', label: 'Турниры', icon: '🏆' },
  { to: '/players', label: 'Игроки', icon: '👥' },
  { to: '/check-in', label: 'Check-In', icon: '📷' },
  { to: '/statistics', label: 'Статистика', icon: '📈' },
  { to: '/settings', label: 'Настройки', icon: '⚙️' },
];

export function Sidebar(): JSX.Element {
  const logout = useLogout();

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-border bg-sidebar px-4 py-6">
      <div className="flex flex-col gap-6">
        <h1 className="px-2 text-lg font-medium text-primary">GUTSHOT CRM</h1>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-secondary-foreground hover:bg-secondary',
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
      >
        🚪 Выход
      </button>
    </aside>
  );
}
