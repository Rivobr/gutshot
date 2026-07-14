import { Tournament } from '@gutshot/types';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Divider } from '../../shared/ui/figma';
import { formatDate, formatMoney, seatsWord } from '../../shared/lib/format';

const UPCOMING_STATUSES = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS'];

export interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps): JSX.Element {
  const navigate = useNavigate();
  const registrationsCount = tournament._count?.registrations ?? 0;
  const seats = Math.max(tournament.maxPlayers - registrationsCount, 0);
  const pct = Math.min(Math.round((registrationsCount / tournament.maxPlayers) * 100), 100);
  const upcoming = UPCOMING_STATUSES.includes(tournament.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
      className="vip-card rounded-[22px] p-5 cursor-pointer card-pressed relative overflow-hidden"
      whileTap={{ scale: 0.984 }}
    >
      <div className="absolute inset-0 deco-lines opacity-50 pointer-events-none rounded-[22px]" />

      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="serif font-semibold leading-snug" style={{ fontSize: 16, color: '#F5EDD6' }}>
            {tournament.title}
          </h3>
          {tournament.description && (
            <p className="sans mt-0.5 truncate" style={{ fontSize: 11, color: '#6B614E' }}>
              {tournament.description}
            </p>
          )}
        </div>
        <span
          className={`px-2.5 py-1 rounded-full sans shrink-0 ${upcoming ? 'status-upcoming' : 'status-done'}`}
          style={{ fontSize: 9, letterSpacing: '0.08em' }}
        >
          {upcoming ? 'Предстоящий' : 'Завершён'}
        </span>
      </div>

      <Divider className="mb-3" />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <p className="sans uppercase" style={{ fontSize: 8, color: '#6B614E', letterSpacing: '0.14em' }}>
            Взнос
          </p>
          <p className="gold-text-sm num font-semibold" style={{ fontSize: 13 }}>
            {formatMoney(tournament.buyIn)}
          </p>
        </div>
        <div>
          <p className="sans uppercase" style={{ fontSize: 8, color: '#6B614E', letterSpacing: '0.14em' }}>
            Дата
          </p>
          <p className="sans" style={{ fontSize: 11, color: '#D8CEBC' }}>
            {formatDate(tournament.date)}
          </p>
        </div>
        <div>
          <p className="sans uppercase" style={{ fontSize: 8, color: '#6B614E', letterSpacing: '0.14em' }}>
            Мест
          </p>
          <p className="gold-text-sm num font-semibold" style={{ fontSize: 13 }}>
            {tournament.maxPlayers}
          </p>
        </div>
      </div>

      {upcoming && (
        <>
          <div className="flex justify-between mb-1.5">
            <span className="sans num" style={{ fontSize: 10, color: '#6B614E' }}>
              {registrationsCount} зарегистрировано
            </span>
            <span
              className="sans num"
              style={{ fontSize: 10, color: seats <= 3 ? '#C0392B' : '#6B614E' }}
            >
              {seats} {seatsWord(seats)}
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(199,154,61,0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #9C6A1F, #C89A3D, #F7D98A)',
                borderRadius: 99,
              }}
            />
          </div>
        </>
      )}

      <div className="flex justify-end mt-2">
        <span style={{ color: 'rgba(199,154,61,0.45)', fontSize: 17 }}>›</span>
      </div>
    </motion.div>
  );
}
