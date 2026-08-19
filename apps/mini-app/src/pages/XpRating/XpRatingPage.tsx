import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import { useProfile, useXpRating } from '../../entities/player';
import { BackButton } from '../../shared/ui/BackButton';
import { SectionLabel } from '../../shared/ui/figma';
import { XpRatingRow } from '../../widgets/GlobalXpRating/GlobalXpRatingCard';

export function XpRatingPage(): JSX.Element {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data, isLoading } = useXpRating();
  const entries = data ?? [];
  const myUserId = profile?.id;
  const me = useMemo(
    () => (myUserId ? entries.find((entry) => entry.userId === myUserId) : undefined),
    [entries, myUserId],
  );

  const openPlayer = (userId: string) => {
    navigate(userId === myUserId ? '/profile' : `/players/${userId}`);
  };

  return (
    <div className="flex flex-col px-5 pb-8 pt-5">
      <BackButton className="mb-4" />
      <h2 className="serif font-semibold" style={{ fontSize: 24, color: '#F5EDD6' }}>
        Глобальный рейтинг
      </h2>
      <p className="sans mt-1" style={{ fontSize: 12, color: '#6B614E' }}>
        Топ по XP · все игроки клуба
      </p>

      {me && (
        <div
          className="mt-4 rounded-[16px] px-3 py-2.5"
          style={{
            background: 'linear-gradient(135deg, rgba(199,154,61,0.2), rgba(20,18,16,0.95))',
            border: '1px solid rgba(247,217,138,0.35)',
          }}
        >
          <p
            className="sans uppercase"
            style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.16em' }}
          >
            Вы здесь
          </p>
          <p className="serif mt-0.5" style={{ fontSize: 16, color: '#F5EDD6' }}>
            {me.rank} место · ур. {me.level ?? '—'}
          </p>
          <p className="gold-text-sm sans num font-semibold" style={{ fontSize: 13 }}>
            {(me.xp ?? me.points ?? 0).toLocaleString('ru-RU')} XP
          </p>
        </div>
      )}

      <div className="mt-5 mb-2">
        <SectionLabel>Полная таблица</SectionLabel>
      </div>

      {isLoading ? (
        <Loader />
      ) : entries.length === 0 ? (
        <p className="sans py-10 text-center" style={{ fontSize: 14, color: '#6B614E' }}>
          Рейтинг пока пуст
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map((entry) => (
            <XpRatingRow
              key={entry.userId}
              entry={entry}
              highlight={entry.userId === myUserId}
              onOpen={openPlayer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
