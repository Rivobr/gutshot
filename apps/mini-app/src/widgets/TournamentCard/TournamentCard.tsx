import { Tournament } from '@gutshot/types';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Divider, SuitWatermark } from '../../shared/ui/figma';
import { formatDate, formatTime, seatsWord } from '../../shared/lib/format';

const UPCOMING_STATUSES = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS'];

const SUITS = ['spade', 'diamond', 'club', 'heart'] as const;

export interface TournamentCardProps {
  tournament: Tournament;
  index?: number;
}

export function TournamentCard({ tournament, index = 0 }: TournamentCardProps): JSX.Element {
  const navigate = useNavigate();
  const registrationsCount = tournament._count?.registrations ?? 0;
  const seats = Math.max(tournament.maxPlayers - registrationsCount, 0);
  const pct = Math.min(Math.round((registrationsCount / tournament.maxPlayers) * 100), 100);
  const upcoming = UPCOMING_STATUSES.includes(tournament.status);
  const suit = SUITS[index % SUITS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
      className="vip-card rounded-[26px] p-6 cursor-pointer card-pressed relative overflow-hidden"
      whileTap={{ scale: 0.984 }}
    >
      <div className="absolute inset-0 deco-lines opacity-50 pointer-events-none rounded-[26px]" />
      <SuitWatermark
        suit={suit}
        style={{
          position: 'absolute',
          right: -14,
          bottom: -10,
          width: 148,
          height: 148,
          opacity: 0.05,
          transform: 'rotate(-12deg)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative flex items-start justify-between mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="serif font-semibold leading-snug truncate" style={{ fontSize: 21, color: '#F5EDD6' }}>
            {tournament.title}
          </h3>
          {tournament.description && (
            <p className="sans mt-1 truncate" style={{ fontSize: 13, color: '#6B614E' }}>
              {tournament.description}
            </p>
          )}
        </div>
        <span
          className={`px-3 py-1.5 rounded-full sans shrink-0 ${upcoming ? 'status-upcoming' : 'status-done'}`}
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          {upcoming ? 'Предстоящий' : 'Завершён'}
        </span>
      </div>

      <Divider className="mb-4 relative" />

      <div className="relative grid grid-cols-3 gap-3 mb-5">
        <div>
          <p className="sans uppercase" style={{ fontSize: 10, color: '#6B614E', letterSpacing: '0.14em' }}>
            Дата
          </p>
          <p className="sans mt-0.5" style={{ fontSize: 14, color: '#D8CEBC' }}>
            {formatDate(tournament.date)}
          </p>
        </div>
        <div>
          <p className="sans uppercase" style={{ fontSize: 10, color: '#6B614E', letterSpacing: '0.14em' }}>
            Время
          </p>
          <p className="sans mt-0.5" style={{ fontSize: 14, color: '#D8CEBC' }}>
            {formatTime(tournament.date)}
          </p>
        </div>
        <div>
          <p className="sans uppercase" style={{ fontSize: 10, color: '#6B614E', letterSpacing: '0.14em' }}>
            Мест
          </p>
          <p className="gold-text-sm num font-semibold mt-0.5" style={{ fontSize: 18 }}>
            {tournament.maxPlayers}
          </p>
        </div>
      </div>

      {upcoming && (
        <div className="relative mb-3">
          <div className="flex justify-between mb-2 items-center">
            <span className="sans num" style={{ fontSize: 12, color: '#6B614E' }}>
              {registrationsCount} зарегистрировано
            </span>
            <span
              className="sans num"
              style={{ fontSize: 12, color: seats <= 3 ? '#C0392B' : '#6B614E' }}
            >
              {seats} {seatsWord(seats)}
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(199,154,61,0.1)' }}>
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
        </div>
      )}

      <div className="relative flex items-center justify-end gap-1 mt-1">
        <span className="sans num" style={{ fontSize: 13, color: 'rgba(199,154,61,0.55)' }}>
          Подробнее
        </span>
        <span style={{ color: 'rgba(199,154,61,0.5)', fontSize: 20 }}>›</span>
      </div>
    </motion.div>
  );
}
