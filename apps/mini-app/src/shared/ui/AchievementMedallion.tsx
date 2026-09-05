/** Золотые значки достижений — ассеты в стиле постера «Система достижений». */

import type { AchievementGroup, AchievementRarity } from '@gutshot/types';
import { styleForAchievement } from '../lib/achievements-catalog';

/** Значок подбирается по группе достижения — так работает весь каталог клуба. */
// Версия ассетов: bump при замене PNG, чтобы сбросить кэш WebView (?v=N).
const BADGES_VERSION = '4';

const ICON_BY_GROUP: Record<AchievementGroup, string> = {
  wins: `/achievements/first_win.png?v=${BADGES_VERSION}`,
  final_tables: `/achievements/final_table.png?v=${BADGES_VERSION}`,
  tournaments: `/achievements/first_visit.png?v=${BADGES_VERSION}`,
  active_weeks: `/achievements/visit_10.png?v=${BADGES_VERSION}`,
  weekly_rating: `/achievements/win_streak.png?v=${BADGES_VERSION}`,
  monthly_final: `/achievements/visit_5.png?v=${BADGES_VERSION}`,
  four_of_a_kind: `/achievements/four_kind.png?v=${BADGES_VERSION}`,
  straight_flush: `/achievements/straight_flush.png?v=${BADGES_VERSION}`,
  royal_flush: `/achievements/royal_flush.png?v=${BADGES_VERSION}`,
  special: `/achievements/win_streak.png?v=${BADGES_VERSION}`,
  knockouts: `/achievements/first_knockout.png?v=${BADGES_VERSION}`,
  legend: `/achievements/royal_flush.png?v=${BADGES_VERSION}`,
};

const FALLBACK_ICON = `/achievements/first_visit.png?v=${BADGES_VERSION}`;

export function AchievementMedallion({
  group,
  locked = false,
  size = 56,
  rarity,
  title,
  achievementId,
}: {
  group?: AchievementGroup;
  locked?: boolean;
  size?: number;
  /** Редкость — рамка и свечение вокруг значка. */
  rarity?: AchievementRarity;
  title?: string;
  achievementId?: string;
}): JSX.Element {
  // Уникальное изображение на каждое достижение; групповой PNG — запасной вариант.
  const perAchievement = achievementId
    ? `/achievements/${achievementId}.png?v=${BADGES_VERSION}`
    : undefined;
  const fallback = (group && ICON_BY_GROUP[group]) || FALLBACK_ICON;
  const style = rarity ? styleForAchievement(achievementId, rarity) : null;
  // Рамка редкости рисуется внутри одного и того же квадрата (outer === size),
  // чтобы все значки в сетке занимали ровно одинаковый размер.
  const pad = rarity && rarity !== 'common' ? Math.max(2, Math.round(size * 0.08)) : 0;
  const outer = size;
  const inner = size - pad * 2;

  return (
    <span
      title={title}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: outer,
        height: outer,
        flexShrink: 0,
        borderRadius: '50%',
        padding: pad,
        boxSizing: 'border-box',
        border: style && rarity !== 'common' ? `1.5px solid ${style.border}` : 'none',
        background: style && rarity !== 'common' ? style.fill : 'transparent',
        boxShadow: !locked && style && rarity !== 'common' ? style.glow : 'none',
      }}
    >
      <img
        src={perAchievement ?? fallback}
        alt=""
        width={inner}
        height={inner}
        draggable={false}
        onError={(event) => {
          const image = event.currentTarget;
          if (perAchievement && !image.dataset.fallback) {
            image.dataset.fallback = '1';
            image.src = fallback;
          }
        }}
        style={{
          width: inner,
          height: inner,
          objectFit: 'contain',
          display: 'block',
          filter: locked
            ? 'grayscale(0.7) brightness(0.45) contrast(0.95)'
            : rarity && rarity !== 'common'
              ? `drop-shadow(0 0 6px ${style?.accent ?? 'rgba(199,154,61,0.4)'})`
              : 'drop-shadow(0 2px 10px rgba(199,154,61,0.4))',
          transition: 'filter 0.25s ease',
          userSelect: 'none',
        }}
      />
    </span>
  );
}
