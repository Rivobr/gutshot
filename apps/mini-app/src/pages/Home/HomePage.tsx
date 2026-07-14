import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import { TournamentCard } from '../../widgets/TournamentCard/TournamentCard';
import { useNearestTournament, useTournaments } from '../../entities/tournament';
import { useProfile } from '../../entities/player';
import { GoldBadge, Logo, SectionLabel, StatPill, initialsOf } from '../../shared/ui/figma';
import { formatDate, formatMoney, formatTime } from '../../shared/lib/format';

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const { data: nearest, isLoading: isNearestLoading } = useNearestTournament();
  const { data: tournaments, isLoading } = useTournaments();
  const { data: profile } = useProfile();

  const xpPct = profile ? Math.round(profile.progress * 100) : 0;

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 deco-lines pointer-events-none" style={{ zIndex: 0 }} />
      <div className="flex flex-col px-5 pb-6 gap-5" style={{ paddingTop: 24, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-start justify-between"
        >
          <div>
            <p className="sans" style={{ fontSize: 11, color: '#6B614E', letterSpacing: '0.06em' }}>
              Добро пожаловать,
            </p>
            <h1
              className="serif font-semibold"
              style={{ fontSize: 22, color: '#F5EDD6', lineHeight: 1.25, marginTop: 2 }}
            >
              {profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Игрок' : '…'}
            </h1>
            {profile && (
              <div className="mt-2">
                <GoldBadge>Уровень {profile.level}</GoldBadge>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo size="sm" />
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center serif font-semibold"
              style={{
                background: 'linear-gradient(135deg, #9C6A1F, #C89A3D)',
                color: '#0A0A0A',
                fontSize: 14,
                marginTop: 4,
              }}
            >
              {profile ? initialsOf(profile.firstName, profile.lastName) : '♠'}
            </div>
          </div>
        </motion.div>

        {/* Hero — nearest tournament */}
        <div>
          <SectionLabel>Ближайший турнир</SectionLabel>
        </div>
        {isNearestLoading ? (
          <Loader />
        ) : nearest ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            onClick={() => navigate(`/tournaments/${nearest.id}`)}
            className="vip-card-hero relative rounded-[22px] overflow-hidden cursor-pointer"
            whileTap={{ scale: 0.982 }}
          >
            <div className="absolute inset-0 deco-lines opacity-50 pointer-events-none" />
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(247,217,138,0.5), transparent)' }}
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="status-upcoming rounded-full px-3 py-1 sans" style={{ fontSize: 9, letterSpacing: '0.1em' }}>
                  ● ПРЕДСТОЯЩИЙ
                </span>
                <span className="sans num" style={{ fontSize: 11, color: '#6B614E' }}>
                  {formatTime(nearest.date)} · {formatDate(nearest.date)}
                </span>
              </div>
              <h2 className="serif font-semibold mb-1" style={{ fontSize: 23, lineHeight: 1.2, color: '#F5EDD6' }}>
                {nearest.title}
              </h2>
              {nearest.description && (
                <p className="sans mb-5" style={{ fontSize: 12, color: '#6B614E' }}>
                  {nearest.description}
                </p>
              )}
              <div className="flex gap-5">
                <div>
                  <p className="sans uppercase" style={{ fontSize: 8, color: '#6B614E', letterSpacing: '0.16em' }}>
                    Взнос
                  </p>
                  <p className="gold-text serif font-semibold num" style={{ fontSize: 20 }}>
                    {formatMoney(nearest.buyIn)}
                  </p>
                </div>
                <div className="w-px" style={{ background: 'rgba(199,154,61,0.2)' }} />
                <div>
                  <p className="sans uppercase" style={{ fontSize: 8, color: '#6B614E', letterSpacing: '0.16em' }}>
                    Мест всего
                  </p>
                  <p className="serif font-semibold num" style={{ fontSize: 20, color: '#F5EDD6' }}>
                    {nearest.maxPlayers}
                  </p>
                </div>
                <div className="w-px" style={{ background: 'rgba(199,154,61,0.2)' }} />
                <div>
                  <p className="sans uppercase" style={{ fontSize: 8, color: '#6B614E', letterSpacing: '0.16em' }}>
                    Занято
                  </p>
                  <p className="gold-text serif font-semibold num" style={{ fontSize: 20 }}>
                    {nearest._count?.registrations ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <p className="sans" style={{ fontSize: 12, color: '#6B614E' }}>
            Нет предстоящих турниров
          </p>
        )}

        {/* XP progress */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="vip-card rounded-[18px] p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="sans uppercase" style={{ fontSize: 8, color: '#6B614E', letterSpacing: '0.16em' }}>
                  Прогресс уровня
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="gold-text serif font-semibold num" style={{ fontSize: 24 }}>
                    {profile.xp.toLocaleString('ru-RU')}
                  </span>
                  <span className="sans num" style={{ fontSize: 12, color: '#6B614E' }}>
                    / {profile.nextLevelXp.toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>
              <GoldBadge>Ур. {profile.level}</GoldBadge>
            </div>
            <div className="rounded-full overflow-hidden mb-2" style={{ height: 4, background: 'rgba(199,154,61,0.1)' }}>
              <div
                className="xp-grow rounded-full"
                style={{
                  height: '100%',
                  width: `${xpPct}%`,
                  background: 'linear-gradient(90deg, #9C6A1F 0%, #C89A3D 50%, #F7D98A 100%)',
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="sans" style={{ fontSize: 9, color: '#6B614E' }}>
                Уровень {profile.level}
              </span>
              <span className="sans num" style={{ fontSize: 9, color: '#6B614E' }}>
                {Math.max(profile.nextLevelXp - profile.xp, 0).toLocaleString('ru-RU')} XP до следующего
              </span>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        {profile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <div className="mb-3">
              <SectionLabel>Статистика</SectionLabel>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="Сыграно" value={profile.stats.tournamentsPlayed.toString()} />
              <StatPill label="Побед" value={profile.stats.wins.toString()} accent />
              <StatPill label="Уровень" value={profile.level.toString()} accent />
            </div>
          </motion.div>
        )}

        {/* All tournaments */}
        <div className="mt-1">
          <SectionLabel>Все турниры</SectionLabel>
        </div>
        {isLoading ? (
          <Loader />
        ) : (
          <div className="flex flex-col gap-3">
            {tournaments?.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 pt-2 pb-2">
          <Logo size="sm" />
          <p className="sans text-center" style={{ fontSize: 10, color: '#3E3428', letterSpacing: '0.06em' }}>
            Миллионная улица, 19 · Санкт-Петербург
          </p>
        </div>
      </div>
    </div>
  );
}
