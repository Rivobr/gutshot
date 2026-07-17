import { motion } from 'framer-motion';
import { Loader } from '@gutshot/ui';
import { useProfile, useTournamentHistory } from '../../entities/player';
import { GoldBadge, Logo, SectionLabel, initialsOf } from '../../shared/ui/figma';
import { formatDate } from '../../shared/lib/format';

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

interface Achievement {
  icon: string;
  title: string;
  unlocked: boolean;
  progress?: string;
}

export function ProfilePage(): JSX.Element {
  const { data: profile, isLoading } = useProfile();
  const { data: history } = useTournamentHistory();

  if (isLoading || !profile) {
    return <Loader />;
  }

  const xpPct = Math.round(profile.progress * 100);
  const s = profile.stats;
  const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Игрок';

  const stats: StatItem[] = [
    { icon: '🏆', value: `${s.wins}`, label: 'Побед' },
    { icon: '🃏', value: `${s.tournamentsPlayed}`, label: 'Турниров сыграно' },
    { icon: '🎖', value: `${s.itm} ITM / ${s.top10Percent}% ТОП-10`, label: 'В призах' },
    { icon: '👑', value: `${s.firstPlaces}`, label: 'Первых мест' },
    { icon: '📈', value: s.averagePlace !== null ? `${s.averagePlace}` : '—', label: 'Среднее место' },
    { icon: '📅', value: `${s.daysInClub}`, label: 'Дней в клубе' },
  ];

  const achievements: Achievement[] = [
    { icon: '🏆', title: 'Первая игра', unlocked: s.tournamentsPlayed > 0 },
    { icon: '🃏', title: 'Первая пара', unlocked: s.tournamentsPlayed >= 2 },
    { icon: '🪙', title: 'Первый ITM', unlocked: s.itm > 0 },
    { icon: '👑', title: 'Первый финальный стол', unlocked: s.top10Percent > 0 },
    {
      icon: '🔒',
      title: 'Первая победа',
      unlocked: s.wins > 0,
      progress: `${Math.min(s.wins, 1)}/1`,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Identity header */}
      <div
        className="relative px-5 pt-8 pb-8 flex flex-col items-center gap-3"
        style={{
          background: 'linear-gradient(180deg, #181309 0%, #090909 100%)',
          borderBottom: '1px solid rgba(199,154,61,0.12)',
        }}
      >
        <div className="absolute inset-0 deco-lines opacity-45 pointer-events-none" />
        <Logo size="md" />

        <div className="relative mt-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center serif font-semibold"
            style={{
              background: 'linear-gradient(135deg, #9C6A1F 0%, #C89A3D 50%, #F7D98A 100%)',
              color: '#0A0A0A',
              fontSize: 28,
              boxShadow: '0 0 0 3px rgba(199,154,61,0.18), 0 0 32px rgba(156,106,31,0.28)',
            }}
          >
            {initialsOf(profile.firstName, profile.lastName)}
          </div>
        </div>

        <div className="text-center">
          <h2 className="serif font-semibold" style={{ fontSize: 22, color: '#F5EDD6', lineHeight: 1.2 }}>
            {name}
          </h2>
          <div className="mt-2">
            <GoldBadge>Уровень {profile.level} ›</GoldBadge>
          </div>
          {profile.username && (
            <p className="sans mt-2" style={{ fontSize: 11, color: '#6B614E' }}>
              @{profile.username}
            </p>
          )}
        </div>

        {/* KYC verification */}
        <div
          className="relative flex items-center gap-2 px-3.5 py-2 rounded-full mt-1"
          style={{
            background: profile.isVerified ? 'rgba(199,154,61,0.1)' : 'rgba(120,110,90,0.08)',
            border: `1px solid ${profile.isVerified ? 'rgba(199,154,61,0.35)' : 'rgba(120,110,90,0.25)'}`,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L20 5V11C20 16 16.5 20 12 22C7.5 20 4 16 4 11V5L12 2Z"
              fill={profile.isVerified ? 'url(#shieldG)' : 'none'}
              stroke={profile.isVerified ? 'none' : '#6B614E'}
              strokeWidth="1.5"
            />
            {profile.isVerified && (
              <path d="M8.5 12L11 14.5L15.5 9.5" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <defs>
              <linearGradient id="shieldG" x1="4" y1="2" x2="20" y2="22">
                <stop stopColor="#C89A3D" />
                <stop offset="1" stopColor="#9C6A1F" />
              </linearGradient>
            </defs>
          </svg>
          <span className="sans" style={{ fontSize: 10.5, color: profile.isVerified ? '#C89A3D' : '#6B614E' }}>
            {profile.isVerified ? 'Профиль подтверждён (документы, паспорт)' : 'Профиль не подтверждён'}
          </span>
        </div>

        {/* Level progress */}
        <div className="w-full mt-2">
          <div className="flex justify-between mb-1.5">
            <span className="sans num" style={{ fontSize: 9, color: '#6B614E' }}>
              {profile.xp.toLocaleString('ru-RU')} XP
            </span>
            <span className="sans num" style={{ fontSize: 9, color: '#6B614E' }}>
              {profile.nextLevelXp.toLocaleString('ru-RU')} XP
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(199,154,61,0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg,#9C6A1F,#C89A3D,#F7D98A)',
                borderRadius: 99,
              }}
            />
          </div>
          <p className="sans num mt-1.5 text-center" style={{ fontSize: 9, color: 'rgba(199,154,61,0.5)' }}>
            {Math.max(profile.nextLevelXp - profile.xp, 0).toLocaleString('ru-RU')} XP до следующего уровня
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-6">
        {/* Statistics */}
        <div>
          <div className="mb-3 flex items-baseline gap-2">
            <SectionLabel>Статистика</SectionLabel>
            <span className="sans uppercase" style={{ fontSize: 8, color: 'rgba(199,154,61,0.45)', letterSpacing: '0.18em' }}>
              · Общая
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5 p-4 rounded-[18px] vip-card">
                <span style={{ fontSize: 18 }}>{stat.icon}</span>
                <span className="sans font-semibold" style={{ fontSize: 14, color: '#F5EDD6', lineHeight: 1.3 }}>
                  {stat.value}
                </span>
                <span className="sans uppercase" style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.12em' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Достижения</SectionLabel>
          </div>
          <div className="flex gap-3 overflow-x-auto hs pb-1 -mx-5 px-5">
            {achievements.map((a) => (
              <div
                key={a.title}
                className="shrink-0 flex flex-col items-center gap-2 p-3 rounded-[16px] vip-card"
                style={{ width: 96, opacity: a.unlocked ? 1 : 0.45 }}
              >
                <span
                  style={{
                    fontSize: 26,
                    filter: a.unlocked ? 'drop-shadow(0 0 8px rgba(199,154,61,0.5))' : 'grayscale(1)',
                  }}
                >
                  {a.unlocked ? a.icon : '🔒'}
                </span>
                <span className="sans text-center" style={{ fontSize: 9.5, color: '#D8CEBC', lineHeight: 1.25 }}>
                  {a.title}
                </span>
                <span
                  className="sans"
                  style={{ fontSize: 8.5, color: a.unlocked ? '#C89A3D' : '#6B614E', letterSpacing: '0.06em' }}
                >
                  {a.unlocked ? 'Получено' : a.progress ?? 'Закрыто'}
                </span>
              </div>
            ))}
          </div>

          {/* Rare milestone */}
          <div
            className="mt-3 rounded-[18px] p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #14110b 0%, #0d0b07 100%)',
              border: '1px solid rgba(120,110,90,0.25)',
            }}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
            <div className="relative flex items-start gap-3">
              <span style={{ fontSize: 26, filter: 'grayscale(0.6)', opacity: 0.7 }}>👑</span>
              <div className="min-w-0">
                <p className="serif font-semibold" style={{ fontSize: 14, color: '#C0B49A', lineHeight: 1.3 }}>
                  💎 Самое редкое достижение клуба: Легенда Gutshot
                </p>
                <p className="sans mt-1.5" style={{ fontSize: 10, color: '#6B614E', lineHeight: 1.5 }}>
                  Выдаётся при одновременном выполнении: 100 побед, 100 уровень, хотя бы один
                  роял-флеш, 100 нокаутов, 1 победа в финале месяца.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        {history && history.length > 0 && (
          <div>
            <div className="mb-3">
              <SectionLabel>История</SectionLabel>
            </div>
            {history.map((registration, i) => (
              <div
                key={registration.id}
                className={`flex items-center justify-between py-3 ${i > 0 ? 'border-t' : ''}`}
                style={{ borderColor: 'rgba(199,154,61,0.1)' }}
              >
                <div>
                  <p className="serif" style={{ fontSize: 14, color: '#F5EDD6', lineHeight: 1.35 }}>
                    {registration.tournament?.title ?? 'Турнир'}
                  </p>
                  {registration.tournament && (
                    <p className="sans num" style={{ fontSize: 10, color: '#6B614E' }}>
                      {formatDate(registration.tournament.date)}
                    </p>
                  )}
                </div>
                <span className="sans" style={{ fontSize: 11, color: '#C89A3D' }}>
                  {registration.status === 'FINISHED' ? 'Завершён' : 'Участие'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 py-4">
          <Logo size="sm" />
          <p className="sans text-center" style={{ fontSize: 10, color: '#3E3428' }}>
            Версия 1.0 · GUTSHOT Poker Club
          </p>
        </div>
      </div>
    </div>
  );
}
