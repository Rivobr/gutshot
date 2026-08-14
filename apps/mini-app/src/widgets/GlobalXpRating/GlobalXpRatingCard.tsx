import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { RatingEntry } from '@gutshot/types';
import { useXpRating } from '../../entities/player';
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar';
import { displayNameOf } from '../../shared/lib/display-name';

const PREVIEW_SIZE = 5;

const RANK_TONE: Record<number, { color: string; bg: string; border: string }> = {
  1: {
    color: '#E8C36A',
    bg: 'rgba(232,195,106,0.18)',
    border: 'rgba(232,195,106,0.6)',
  },
  2: {
    color: '#C9CDD3',
    bg: 'rgba(201,205,211,0.14)',
    border: 'rgba(201,205,211,0.45)',
  },
  3: {
    color: '#D08A52',
    bg: 'rgba(208,138,82,0.16)',
    border: 'rgba(208,138,82,0.5)',
  },
};

function formatXp(value: number): string {
  return value.toLocaleString('ru-RU');
}

function rankTone(rank: number) {
  return (
    RANK_TONE[rank] ?? {
      color: '#8A7A62',
      bg: 'rgba(9,9,9,0.4)',
      border: 'rgba(199,154,61,0.16)',
    }
  );
}

function Chip({ size, style }: { size: number; style: CSSProperties }): JSX.Element {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        display: 'inline-block',
        boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.35)',
        ...style,
      }}
    />
  );
}

export function XpRatingRow({
  entry,
  highlight,
  onOpen,
}: {
  entry: RatingEntry;
  highlight?: boolean;
  onOpen: (userId: string) => void;
}): JSX.Element {
  const tone = rankTone(entry.rank);
  const xp = entry.xp ?? entry.points ?? 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(entry.userId)}
      className="flex w-full items-center gap-2.5 rounded-[14px] px-2 py-2 text-left"
      style={{
        background: highlight
          ? 'linear-gradient(135deg, rgba(199,154,61,0.18), rgba(20,18,16,0.9))'
          : 'transparent',
        border: highlight ? '1px solid rgba(247,217,138,0.35)' : '1px solid transparent',
        cursor: 'pointer',
      }}
    >
      <span
        className="serif num flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold"
        style={{
          fontSize: 13,
          color: tone.color,
          background: tone.bg,
          border: `1px solid ${tone.border}`,
        }}
      >
        {entry.rank}
      </span>
      <PlayerAvatar
        photoUrl={entry.photoUrl}
        firstName={entry.firstName}
        lastName={entry.lastName}
        nickname={entry.nickname}
        size={34}
      />
      <span className="serif min-w-0 flex-1 truncate" style={{ fontSize: 13.5, color: '#F5EDD6' }}>
        {highlight ? 'Вы' : displayNameOf(entry)}
      </span>
      <span
        className="sans num shrink-0"
        style={{
          fontSize: 11,
          color: '#F7D98A',
          background: 'rgba(199,154,61,0.14)',
          border: '1px solid rgba(199,154,61,0.28)',
          borderRadius: 999,
          padding: '2px 8px',
          fontWeight: 600,
        }}
      >
        Ур. {entry.level ?? '—'}
      </span>
      <span className="gold-text-sm sans num shrink-0 font-semibold" style={{ fontSize: 12.5 }}>
        {formatXp(xp)}
      </span>
    </button>
  );
}

export function GlobalXpRatingCard({
  currentUserId,
}: {
  currentUserId?: string;
}): JSX.Element | null {
  const navigate = useNavigate();
  const { data, isLoading } = useXpRating();
  const entries = data ?? [];
  const preview = entries.slice(0, PREVIEW_SIZE);

  const openPlayer = (userId: string) => {
    navigate(userId === currentUserId ? '/profile' : `/players/${userId}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      className="relative overflow-hidden rounded-[22px] p-4"
      style={{
        background:
          'linear-gradient(165deg, rgba(48,36,16,0.95) 0%, rgba(18,14,10,0.98) 42%, rgba(12,10,8,1) 100%)',
        border: '1.5px solid rgba(232,195,106,0.55)',
        boxShadow:
          '0 0 0 1px rgba(247,217,138,0.12), 0 10px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(247,217,138,0.18)',
      }}
    >
      <div className="absolute inset-0 deco-lines opacity-30 pointer-events-none" />
      <div
        className="pointer-events-none absolute -right-8 -top-10 opacity-25"
        style={{
          width: 140,
          height: 140,
          background: 'radial-gradient(circle, rgba(247,217,138,0.35), transparent 68%)',
        }}
      />

      <div className="relative mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ fontSize: 22 }} aria-hidden>
            🏆
          </span>
          <div className="min-w-0">
            <p
              className="gold-text serif font-semibold uppercase"
              style={{ fontSize: 16, letterSpacing: '0.08em', lineHeight: 1.15 }}
            >
              Глобальный рейтинг
            </p>
            <p
              className="sans uppercase mt-0.5"
              style={{ fontSize: 9, color: '#8A7A62', letterSpacing: '0.16em' }}
            >
              Топ по XP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pr-1" aria-hidden>
          <Chip
            size={18}
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffe08a, #c89a3d 55%, #7a5418)',
            }}
          />
          <Chip
            size={14}
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffd0d0, #b4232a 55%, #6b1014)',
            }}
          />
          <Chip
            size={16}
            style={{
              background: 'radial-gradient(circle at 35% 30%, #d8e8ff, #4a6fa5 55%, #24385c)',
            }}
          />
        </div>
      </div>

      <div
        className="relative mb-1.5 flex items-center gap-2.5 px-2"
        style={{ color: '#6B614E' }}
      >
        <span className="sans uppercase" style={{ width: 32, fontSize: 8, letterSpacing: '0.14em' }}>
          #
        </span>
        <span className="sans uppercase flex-1" style={{ fontSize: 8, letterSpacing: '0.14em' }}>
          Игрок
        </span>
        <span className="sans uppercase" style={{ fontSize: 8, letterSpacing: '0.14em' }}>
          Ур.
        </span>
        <span className="sans uppercase w-14 text-right" style={{ fontSize: 8, letterSpacing: '0.14em' }}>
          XP
        </span>
      </div>

      <div className="relative flex flex-col gap-0.5">
        {isLoading && (
          <p className="sans px-2 py-4" style={{ fontSize: 12, color: '#6B614E' }}>
            Загрузка…
          </p>
        )}
        {!isLoading && preview.length === 0 && (
          <p className="sans px-2 py-4" style={{ fontSize: 12, color: '#6B614E' }}>
            Рейтинг пока пуст
          </p>
        )}
        {preview.map((entry) => (
          <XpRatingRow
            key={entry.userId}
            entry={entry}
            highlight={entry.userId === currentUserId}
            onOpen={openPlayer}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate('/rating/xp')}
        className="relative mt-3 w-full rounded-[14px] py-3 sans font-semibold uppercase"
        style={{
          fontSize: 11,
          letterSpacing: '0.14em',
          cursor: 'pointer',
          color: '#0A0A0A',
          background: 'linear-gradient(135deg, #9C6A1F 0%, #C89A3D 40%, #F7D98A 70%, #C89A3D 100%)',
          border: 'none',
          boxShadow: '0 4px 22px rgba(156,106,31,0.35)',
        }}
      >
        Показать полный рейтинг
      </button>
    </motion.section>
  );
}
