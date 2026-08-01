import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import { useTournament, useTournamentParticipants } from '../../entities/tournament';
import {
  useCancelRegistration,
  useCurrentRegistration,
  useRegister,
} from '../../entities/registration';
import { Divider, InfoCard, SectionLabel, goldButtonStyle } from '../../shared/ui/figma';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { displayNameOf } from '../../shared/lib/display-name';
import { formatDate, formatTime, seatsWord } from '../../shared/lib/format';

const UPCOMING_STATUSES = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS'];

export function TournamentPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tournament, isLoading } = useTournament(id ?? '');
  const { data: participants } = useTournamentParticipants(id ?? '');
  const { data: currentRegistration } = useCurrentRegistration();
  const registerMutation = useRegister();
  const cancelMutation = useCancelRegistration();

  if (isLoading || !tournament) {
    return <Loader />;
  }

  const registrationsCount = tournament._count?.registrations ?? 0;
  const seats = Math.max(tournament.maxPlayers - registrationsCount, 0);
  const pct = Math.min(Math.round((registrationsCount / tournament.maxPlayers) * 100), 100);
  const upcoming = UPCOMING_STATUSES.includes(tournament.status);
  const isMine = currentRegistration?.tournamentId === tournament.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col pb-6"
    >
      <div className="px-5 pt-6 pb-5 relative">
        <div className="absolute inset-0 deco-lines opacity-25 pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 mb-5 sans"
          style={{
            color: 'rgba(199,154,61,0.65)',
            fontSize: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← Назад
        </button>

        <span
          className={`rounded-full px-3 py-1 sans inline-flex mb-3 ${upcoming ? 'status-upcoming' : 'status-done'}`}
          style={{ fontSize: 9, letterSpacing: '0.1em' }}
        >
          {upcoming ? '● ПРЕДСТОЯЩИЙ' : 'ЗАВЕРШЁН'}
        </span>

        <h1 className="serif font-semibold mt-2 mb-1" style={{ fontSize: 26, lineHeight: 1.15, color: '#F5EDD6' }}>
          {tournament.title}
        </h1>
        <p className="sans num" style={{ fontSize: 12, color: '#6B614E' }}>
          {formatDate(tournament.date)} · {formatTime(tournament.date)}
        </p>
      </div>

      <Divider className="mx-5" />

      <div className="px-5 pt-5 grid grid-cols-2 gap-3">
        <InfoCard label="Игроки" value={`${registrationsCount} / ${tournament.maxPlayers}`} icon="👥" />
        <InfoCard label="Мест осталось" value={seats.toString()} icon={seats <= 3 ? '🔴' : '🟢'} />
        <InfoCard label="Дата" value={formatDate(tournament.date)} icon="📅" />
        <InfoCard label="Время" value={formatTime(tournament.date)} icon="🕐" />
      </div>

      {upcoming && (
        <div className="px-5 mt-4">
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(199,154,61,0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #9C6A1F, #C89A3D, #F7D98A)',
                borderRadius: 99,
              }}
            />
          </div>
        </div>
      )}

      {tournament.description && (
        <div className="px-5 mt-5">
          <div className="mb-3">
            <SectionLabel>О турнире</SectionLabel>
          </div>
          <p className="serif" style={{ fontSize: 15, color: '#C0B49A', lineHeight: 1.7 }}>
            {tournament.description}
          </p>
        </div>
      )}

      {isMine ? (
        <div className="px-5 mt-6 flex flex-col gap-3">
          <div
            className="w-full py-4 rounded-[18px] serif font-semibold tracking-widest text-center"
            style={{
              ...goldButtonStyle(),
              opacity: 0.92,
            }}
          >
            {currentRegistration?.status === 'WAITING' ? 'В ЛИСТЕ ОЖИДАНИЯ' : 'ВЫ ЗАПИСАНЫ'}
          </div>
          {(currentRegistration?.status === 'REGISTERED' ||
            currentRegistration?.status === 'WAITING') && (
            <button
              type="button"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(currentRegistration.id)}
              className="w-full py-3.5 rounded-[18px] sans font-medium disabled:opacity-50"
              style={{
                background: 'rgba(192,57,43,0.12)',
                border: '1px solid rgba(192,57,43,0.4)',
                color: '#E07A6E',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Отменить регистрацию
            </button>
          )}
        </div>
      ) : (
        <div className="px-5 mt-6">
          <button
            disabled={tournament.status !== 'REGISTRATION_OPEN' || registerMutation.isPending}
            onClick={() => registerMutation.mutate(tournament.id)}
            className="btn-shine w-full py-4 rounded-[18px] serif font-semibold tracking-widest disabled:opacity-50"
            style={goldButtonStyle()}
          >
            {tournament.status === 'REGISTRATION_OPEN' ? 'ЗАРЕГИСТРИРОВАТЬСЯ' : 'РЕГИСТРАЦИЯ ЗАКРЫТА'}
          </button>
          {tournament.status === 'REGISTRATION_OPEN' && (
            <p className="sans text-center mt-2.5" style={{ fontSize: 10, color: '#6B614E' }}>
              {seats} {seatsWord(seats)} · Регистрация закрывается за 2 часа до начала
            </p>
          )}
          {registerMutation.isError && (
            <p className="sans text-center mt-2.5" style={{ fontSize: 11, color: '#C0392B' }}>
              Не удалось зарегистрироваться. Попробуйте снова.
            </p>
          )}
          {registerMutation.isSuccess && (
            <p className="sans text-center mt-2.5" style={{ fontSize: 11, color: '#C89A3D' }}>
              Вы успешно зарегистрированы!
            </p>
          )}
        </div>
      )}

      <div className="px-5 mt-7">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Участники</SectionLabel>
          <span className="sans num" style={{ fontSize: 10, color: '#6B614E' }}>
            {participants?.length ?? 0}
          </span>
        </div>

        {!participants || participants.length === 0 ? (
          <div className="vip-card rounded-[18px] py-8 flex flex-col items-center gap-2">
            <span style={{ fontSize: 26, opacity: 0.25 }}>♠</span>
            <p className="serif" style={{ fontSize: 14, color: '#6B614E' }}>
              Пока никто не зарегистрирован
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {participants.map((p, i) => (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="vip-card rounded-[16px] p-3 flex items-center gap-3"
              >
                <PlayerAvatar
                  photoUrl={p.photoUrl}
                  firstName={p.firstName}
                  lastName={p.lastName}
                  nickname={p.nickname}
                  size={44}
                />
                <div className="flex-1 min-w-0">
                  <p className="serif font-semibold truncate" style={{ fontSize: 15, color: '#F5EDD6' }}>
                    {displayNameOf(p)}
                  </p>
                  <div className="flex items-center gap-2">
                    {p.username && (
                      <span className="sans truncate" style={{ fontSize: 11, color: '#6B614E' }}>
                        @{p.username}
                      </span>
                    )}
                    <span className="sans" style={{ fontSize: 10, color: 'rgba(199,154,61,0.6)' }}>
                      Уровень {p.level}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="sans num gold-text-sm font-semibold" style={{ fontSize: 12 }}>
                    ТОП-10: {p.top10Percent}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
