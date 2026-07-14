import { motion } from 'framer-motion';
import { Loader } from '@gutshot/ui';
import { useProfile, useTournamentHistory } from '../../entities/player';
import { GoldBadge, InfoCard, Logo, SectionLabel, initialsOf } from '../../shared/ui/figma';
import { formatDate } from '../../shared/lib/format';

export function ProfilePage(): JSX.Element {
  const { data: profile, isLoading } = useProfile();
  const { data: history } = useTournamentHistory();

  if (isLoading || !profile) {
    return <Loader />;
  }

  const xpPct = Math.round(profile.progress * 100);

  return (
    <div className="flex flex-col">
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
              fontSize: 22,
              boxShadow: '0 0 0 3px rgba(199,154,61,0.18), 0 0 32px rgba(156,106,31,0.28)',
            }}
          >
            {initialsOf(profile.firstName, profile.lastName)}
          </div>
        </div>

        <div className="text-center">
          <h2 className="serif font-semibold" style={{ fontSize: 21, color: '#F5EDD6', lineHeight: 1.2 }}>
            {`${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Игрок'}
          </h2>
          <div className="mt-2">
            <GoldBadge>Уровень {profile.level}</GoldBadge>
          </div>
          {profile.username && (
            <p className="sans mt-2" style={{ fontSize: 11, color: '#6B614E' }}>
              @{profile.username}
            </p>
          )}
        </div>

        <div className="w-full mt-1">
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

      <div className="px-5 py-5 flex flex-col gap-5">
        <div>
          <div className="mb-3">
            <SectionLabel>Статистика</SectionLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Турниры" value={profile.stats.tournamentsPlayed.toString()} icon="🃏" />
            <InfoCard label="Победы" value={profile.stats.wins.toString()} icon="🏆" />
          </div>
        </div>

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
