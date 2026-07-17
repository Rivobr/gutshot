import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader } from '@gutshot/ui';
import { TournamentCard } from '../../widgets/TournamentCard/TournamentCard';
import { useTournaments } from '../../entities/tournament';
import { Logo } from '../../shared/ui/figma';

type Tab = 'upcoming' | 'completed';

const UPCOMING_STATUSES = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS'];

export function TournamentsPage(): JSX.Element {
  const { data: tournaments, isLoading } = useTournaments();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    return (tournaments ?? []).filter((t) => {
      const isUpcoming = UPCOMING_STATUSES.includes(t.status);
      const matchesTab = tab === 'upcoming' ? isUpcoming : !isUpcoming;
      const matchesSearch = search === '' || t.title.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [tournaments, tab, search]);

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <Logo size="sm" />
        <h2 className="serif font-semibold mt-4 mb-4" style={{ fontSize: 24, color: '#F5EDD6' }}>
          Турниры
        </h2>

        <div className="relative mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск турниров..."
            className="w-full py-3 px-4 rounded-[14px] sans outline-none"
            style={{
              background: '#181410',
              border: '1px solid rgba(199,154,61,0.2)',
              color: '#F5EDD6',
              fontSize: 13,
              caretColor: '#C89A3D',
            }}
          />
        </div>

        <div
          className="flex rounded-[14px] p-1 gap-1"
          style={{ background: '#0F0D09', border: '1px solid rgba(199,154,61,0.15)' }}
        >
          {(['upcoming', 'completed'] as const).map((tabId) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className="flex-1 py-2.5 rounded-[10px] sans font-medium transition-all duration-300"
              style={{
                fontSize: 12,
                cursor: 'pointer',
                border: 'none',
                background: tab === tabId ? 'linear-gradient(135deg, #9C6A1F, #C89A3D)' : 'transparent',
                color: tab === tabId ? '#0A0A0A' : '#6B614E',
              }}
            >
              {tabId === 'upcoming' ? 'Предстоящие' : 'Прошедшие'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6 flex flex-col gap-3">
        {isLoading ? (
          <Loader />
        ) : visible.length > 0 ? (
          visible.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
            >
              <TournamentCard tournament={t} index={i} />
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span style={{ fontSize: 32, opacity: 0.25 }}>♠</span>
            <p className="serif" style={{ fontSize: 16, color: '#6B614E' }}>
              Турниры не найдены
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
