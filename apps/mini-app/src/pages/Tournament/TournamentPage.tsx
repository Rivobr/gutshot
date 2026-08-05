import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import { useTournament, useTournamentParticipants } from '../../entities/tournament';
import {
  useCancelRegistration,
  useCurrentRegistration,
  useRegister,
} from '../../entities/registration';
import { goldButtonStyle } from '../../shared/ui/figma';
import { PlayersFillBar } from '../../shared/ui/PlayersFillBar';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { AchievementMedallion } from '../../shared/ui/AchievementMedallion';
import { showToast } from '../../shared/ui/toast';
import { displayNameOf } from '../../shared/lib/display-name';
import { formatDate, formatTime } from '../../shared/lib/format';
import { club } from '../../shared/config/club';
import { TournamentLiveBlock } from '../../widgets/TournamentLive/TournamentLiveBlock';

const UPCOMING_STATUSES = ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS'];

type Tab = 'about' | 'players';

export function TournamentPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('about');
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
  const upcoming = UPCOMING_STATUSES.includes(tournament.status);
  const isMine = currentRegistration?.tournamentId === tournament.id;

  const handleRegister = (): void => {
    registerMutation.mutate(tournament.id, {
      onSuccess: (result) => {
        if (result.cancelledPrevious?.title) {
          showToast(
            `Записаны. Предыдущая запись на «${result.cancelledPrevious.title}» отменена`,
            'info',
          );
          return;
        }
        showToast('Вы записаны на турнир');
      },
      onError: (error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Не удалось зарегистрироваться';
        showToast(message, 'error');
      },
    });
  };

  const handleCancel = (): void => {
    if (!currentRegistration) return;
    cancelMutation.mutate(currentRegistration.id, {
      onSuccess: () => showToast('Регистрация отменена', 'info'),
      onError: () => showToast('Не удалось отменить регистрацию', 'error'),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col pb-6"
    >
      <div
        className="relative px-5 pt-5 pb-6 overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #1A1610 0%, #0C0A08 70%)',
          borderBottom: '1px solid rgba(199,154,61,0.18)',
        }}
      >
        {tournament.imageUrl && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${tournament.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.22,
            }}
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            right: -40,
            top: -30,
            width: 220,
            height: 220,
            background:
              'linear-gradient(145deg, rgba(200,154,61,0.28) 0%, rgba(200,154,61,0.06) 55%, transparent 70%)',
            clipPath: 'polygon(35% 0%, 100% 0%, 100% 70%, 55% 100%, 0% 45%)',
            transform: 'rotate(8deg)',
          }}
        />

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="relative flex items-center gap-1.5 mb-4 sans"
          style={{
            color: 'rgba(199,154,61,0.7)',
            fontSize: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← Назад
        </button>

        <p
          className="relative sans uppercase"
          style={{ fontSize: 10, color: '#C89A3D', letterSpacing: '0.22em' }}
        >
          Турнир
        </p>
        <h1
          className="relative serif font-semibold mt-2 mb-2"
          style={{ fontSize: 26, lineHeight: 1.15, color: '#F5EDD6' }}
        >
          {tournament.title}
        </h1>
        <p className="relative sans num" style={{ fontSize: 12, color: '#8A7A62' }}>
          {formatDate(tournament.date)} · {formatTime(tournament.date)} · {registrationsCount}{' '}
          участников
        </p>
      </div>

      <div className="px-5 pt-4 flex gap-2">
        {(
          [
            { id: 'about' as const, label: 'О турнире' },
            {
              id: 'players' as const,
              label: `Участники (${registrationsCount} / ${tournament.maxPlayers})`,
            },
          ] as const
        ).map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className="sans flex-1 py-3 px-3 rounded-[14px]"
              style={{
                fontSize: 12,
                cursor: 'pointer',
                border: active
                  ? '1px solid rgba(199,154,61,0.45)'
                  : '1px solid rgba(199,154,61,0.16)',
                background: active
                  ? 'linear-gradient(145deg, rgba(156,106,31,0.35), rgba(20,16,10,0.95))'
                  : 'rgba(15,13,9,0.9)',
                color: active ? '#F5EDD6' : '#6B614E',
                fontWeight: active ? 600 : 400,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'about' ? (
        <>
          <div className="px-5 pt-5">
            <PlayersFillBar taken={registrationsCount} max={tournament.maxPlayers} />
          </div>

          {tournament.live && (
            <div className="px-5 mt-4">
              <TournamentLiveBlock live={tournament.live} />
            </div>
          )}

          <div className="px-5 mt-4">
            <div
              className="vip-card rounded-[18px] p-4 flex flex-col gap-2.5"
              style={{ border: '1px solid rgba(199,154,61,0.16)' }}
            >
              <p className="sans" style={{ fontSize: 12, color: '#C0B49A' }}>
                📍 {club.city}, {club.address}
              </p>
              <p className="sans" style={{ fontSize: 12, color: '#C0B49A' }}>
                🕐 {formatDate(tournament.date)} · {formatTime(tournament.date)}
              </p>
              <p className="sans" style={{ fontSize: 12, color: upcoming ? '#C89A3D' : '#6B614E' }}>
                {upcoming ? '● Регистрация открыта / скоро старт' : 'Турнир завершён'}
              </p>
            </div>
          </div>

          <div className="px-5 mt-4 grid grid-cols-2 gap-2.5">
            <a
              href={club.supportUrl}
              target="_blank"
              rel="noreferrer"
              className="vip-card rounded-[16px] px-4 py-3.5 sans text-center"
              style={{
                fontSize: 13,
                color: '#F5EDD6',
                border: '1px solid rgba(199,154,61,0.22)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Поддержка
            </a>
            <Link
              to="/directions"
              className="vip-card rounded-[16px] px-4 py-3.5 sans text-center"
              style={{
                fontSize: 13,
                color: '#F5EDD6',
                border: '1px solid rgba(199,154,61,0.22)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Как найти
            </Link>
          </div>

          {tournament.description && (
            <div className="px-5 mt-5">
              <div
                className="vip-card rounded-[18px] p-4"
                style={{ border: '1px solid rgba(199,154,61,0.16)' }}
              >
                <p
                  className="sans uppercase mb-2"
                  style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.16em' }}
                >
                  Подробнее
                </p>
                <p className="serif" style={{ fontSize: 19, color: '#D8CEBC', lineHeight: 1.65 }}>
                  {tournament.description}
                </p>
              </div>
            </div>
          )}

          {isMine ? (
            <div className="px-5 mt-6 flex flex-col gap-3">
              <div
                className="w-full py-4 rounded-[18px] serif font-semibold tracking-widest text-center"
                style={{ ...goldButtonStyle(), opacity: 0.92 }}
              >
                {currentRegistration?.status === 'WAITING' ? 'В ЛИСТЕ ОЖИДАНИЯ' : 'ВЫ ЗАПИСАНЫ'}
              </div>
              {(currentRegistration?.status === 'REGISTERED' ||
                currentRegistration?.status === 'WAITING') && (
                <button
                  type="button"
                  disabled={cancelMutation.isPending}
                  onClick={handleCancel}
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
                type="button"
                disabled={tournament.status !== 'REGISTRATION_OPEN' || registerMutation.isPending}
                onClick={handleRegister}
                className="btn-shine w-full py-4 rounded-[18px] serif font-semibold tracking-widest disabled:opacity-50"
                style={goldButtonStyle()}
              >
                {tournament.status === 'REGISTRATION_OPEN'
                  ? 'ЗАРЕГИСТРИРОВАТЬСЯ'
                  : 'РЕГИСТРАЦИЯ ЗАКРЫТА'}
              </button>
              {tournament.status === 'REGISTRATION_OPEN' && (
                <p className="sans text-center mt-2.5" style={{ fontSize: 10, color: '#6B614E' }}>
                  Свободно {seats} · Регистрация закрывается за 2 часа до начала
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="px-5 mt-5">
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
                    <p
                      className="serif font-semibold truncate"
                      style={{ fontSize: 15, color: '#F5EDD6' }}
                    >
                      {displayNameOf(p)}
                    </p>
                    <div className="flex items-center gap-2">
                      {p.username && (
                        <span className="sans truncate" style={{ fontSize: 11, color: '#6B614E' }}>
                          @{p.username}
                        </span>
                      )}
                      <span
                        className="sans"
                        style={{ fontSize: 10, color: 'rgba(199,154,61,0.6)' }}
                      >
                        Уровень {p.level}
                      </span>
                    </div>
                  </div>
                  {p.pinnedAchievements && p.pinnedAchievements.length > 0 && (
                    <div className="flex shrink-0 items-center gap-1">
                      {p.pinnedAchievements.slice(0, 3).map((achievementId) => (
                        <AchievementMedallion key={achievementId} id={achievementId} size={24} />
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
