import { ACHIEVEMENTS_CATALOG } from '../../common/constants/achievements-catalog';

/**
 * Тексты достижений по умолчанию. Источник — каталог клуба;
 * админ может переопределить название, описание и «как получить».
 */
export const DEFAULT_ACHIEVEMENT_TEXTS: Record<
  string,
  { icon: string; title: string; description: string; howTo: string }
> = Object.fromEntries(
  ACHIEVEMENTS_CATALOG.map((definition) => [
    definition.id,
    {
      icon: definition.icon,
      title: definition.title,
      description: definition.description,
      howTo: definition.howTo,
    },
  ]),
);

export const ACHIEVEMENT_TEXT_ORDER = ACHIEVEMENTS_CATALOG.map((definition) => definition.id);
