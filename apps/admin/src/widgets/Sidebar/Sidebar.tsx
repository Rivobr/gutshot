import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

function NavItems({ onNavigate }: { onNavigate?: () => void }): JSX.Element {
  const logout = useLogout();
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-6">
        <h1 className="px-2 text-lg font-medium text-primary">GUTSHOT CRM</h1>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
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
        onClick={() => {
          onNavigate?.();
          logout();
        }}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
      >
        🚪 Выход
      </button>
    </div>
  );
}

export function Sidebar(): JSX.Element {
  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-border bg-sidebar px-4 py-6 md:block">
      <NavItems />
    </aside>
  );
}

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
        >
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="h-full w-64 border-r border-border bg-sidebar px-4 py-6"
          >
            <NavItems onNavigate={onClose} />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
