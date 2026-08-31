/**
 * Генератор уникальных значков достижений GUTSHOT.
 *
 * Для каждого достижения из каталога (apps/api/src/common/constants/achievements-catalog.ts)
 * создаётся отдельный SVG-медальон в золотом стиле клуба:
 *  - уникальный оттенок золота и рисунок лучей (зависят от индекса);
 *  - уникальная центральная эмблема (эмодзи достижения);
 *  - цвет внешнего кольца по редкости (common/rare/epic/legend).
 *
 * Запуск:  node scripts/generate-achievement-icons.mjs
 * Результат: apps/{mini-app,web,admin}/public/achievements/<id>.svg
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'apps/api/src/common/constants/achievements-catalog.ts');
const targets = [
  join(root, 'apps/mini-app/public/achievements'),
  join(root, 'apps/web/public/achievements'),
  join(root, 'apps/admin/public/achievements'),
];

const RARITY_RING = {
  common: '#A8A8A8',
  rare: '#4A96FF',
  epic: '#BA55FF',
  legend: '#DC3030',
};

function pad2(value) {
  return String(value).padStart(2, '0');
}

function parseCatalog(source) {
  const items = [];

  const tierArgs = (block) => [...block.matchAll(/'([^']*)'/g)].map((m) => m[1]);
  for (const match of source.matchAll(/tier\(([^;]*?)\),\s*\n/g)) {
    const args = tierArgs(match[1]);
    // tier(id, group, metric, icon, title, description, howTo, target, xp, rarity)
    if (args.length >= 8) {
      items.push({ id: args[0], icon: args[3], rarity: args[7] });
    }
  }

  const legend = source.match(/\{\s*id:\s*'legend_gutshot'[^}]*icon:\s*'([^']*)'/s);
  if (legend) {
    items.push({ id: 'legend_gutshot', icon: legend[1], rarity: 'legend' });
  }

  return items;
}

/** Детерминированный «шум» для уникальности каждого значка. */
function seeded(index) {
  let state = (index + 1) * 2654435761;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10000) / 10000;
  };
}

function sparkle(cx, cy, r, color, opacity) {
  const fmt = (v) => v.toFixed(2);
  const q1x = fmt(cx + r * 0.18);
  const q1y = fmt(cy - r * 0.18);
  const q2y = fmt(cy + r * 0.18);
  return (
    `<path d="M ${fmt(cx)} ${fmt(cy - r)} Q ${q1x} ${q1y} ${fmt(cx + r)} ${fmt(cy)} ` +
    `Q ${q1x} ${q2y} ${fmt(cx)} ${fmt(cy + r)} ` +
    `Q ${fmt(cx - r * 0.18)} ${q2y} ${fmt(cx - r)} ${fmt(cy)} ` +
    `Q ${fmt(cx - r * 0.18)} ${q1y} ${fmt(cx)} ${fmt(cy - r)} Z" ` +
    `fill="${color}" opacity="${opacity}"/>`
  );
}

function laurelSide(side) {
  // side: -1 левая ветвь, 1 правая. Листья вдоль нижней дуги медальона.
  const leaves = [];
  for (let i = 0; i < 6; i += 1) {
    const t = i / 5;
    const angle = Math.PI * (0.62 + 0.28 * t);
    const x = 48 + side * Math.abs(38 * Math.cos(angle * 0.9));
    const y = 48 + 30 * Math.sin(angle * 0.9);
    const rot = side * (-70 + t * 80);
    leaves.push(
      `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.2" ry="2.1" ` +
        `fill="#B98A22" opacity="0.9" transform="rotate(${rot.toFixed(0)} ` +
        `${x.toFixed(1)} ${y.toFixed(1)})"/>`,
    );
  }
  return leaves.join('');
}

function svgFor({ id, icon, rarity }, index) {
  const rand = seeded(index);
  const hue = 36 + Math.floor(rand() * 26); // 36..61 — золотая гамма, уникальна у каждого
  const rays = 12 + Math.floor(rand() * 3) * 4; // 12/16/20 лучей
  const rayRotation = Math.floor(rand() * 360);
  const inner = `hsl(${hue}, 78%, ${64 + Math.floor(rand() * 8)}%)`;
  const innerMid = `hsl(${hue}, 72%, 46%)`;
  const innerDark = `hsl(${hue - 6}, 68%, 27%)`;
  const ring = RARITY_RING[rarity] ?? RARITY_RING.common;
  const sparkCount = 3 + Math.floor(rand() * 3);
  const sparks = [];
  for (let i = 0; i < sparkCount; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 38 + rand() * 4;
    sparks.push(
      sparkle(
        48 + radius * Math.cos(angle),
        48 + radius * Math.sin(angle),
        1.6 + rand() * 1.6,
        '#FFF3C4',
        (0.5 + rand() * 0.4).toFixed(2),
      ),
    );
  }

  const rayLines = [];
  for (let i = 0; i < rays; i += 1) {
    const a = rayRotation + (i * 360) / rays;
    rayLines.push(
      `<line x1="48" y1="48" x2="${(48 + 36 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" ` +
        `y2="${(48 + 36 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" ` +
        `stroke="hsl(${hue}, 70%, 38%)" stroke-width="1" opacity="0.35"/>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <radialGradient id="rim-${pad2(index)}" cx="35%" cy="28%" r="85%">
      <stop offset="0%" stop-color="#FFF0B8"/>
      <stop offset="45%" stop-color="hsl(${hue}, 74%, 58%)"/>
      <stop offset="100%" stop-color="hsl(${hue - 8}, 70%, 28%)"/>
    </radialGradient>
    <radialGradient id="core-${pad2(index)}" cx="50%" cy="36%" r="78%">
      <stop offset="0%" stop-color="${inner}"/>
      <stop offset="58%" stop-color="${innerMid}"/>
      <stop offset="100%" stop-color="${innerDark}"/>
    </radialGradient>
  </defs>
  <circle cx="48" cy="48" r="47" fill="url(#rim-${pad2(index)})"/>
  <circle cx="48" cy="48" r="45.4" fill="none" stroke="${ring}" stroke-width="2.4"/>
  <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(${hue - 10}, 66%, 24%)" stroke-width="0.8" opacity="0.7"/>
  <g>
    ${rayLines.join('\n    ')}
  </g>
  <circle cx="48" cy="48" r="34.5" fill="url(#core-${pad2(index)})" stroke="hsl(${hue - 10}, 64%, 22%)" stroke-width="1.1"/>
  <g opacity="0.85">
    ${laurelSide(-1)}
    ${laurelSide(1)}
  </g>
  <text x="48" y="51" text-anchor="middle" dominant-baseline="central" font-size="32" font-family="'Noto Color Emoji','Apple Color Emoji','Segoe UI Emoji',sans-serif">${icon}</text>
  ${sparks.join('\n  ')}
</svg>
`;
}

const source = readFileSync(catalogPath, 'utf8');
const items = parseCatalog(source);

if (items.length === 0) {
  console.error('Каталог достижений не распознан');
  process.exit(1);
}

const ids = new Set();
for (const item of items) {
  if (ids.has(item.id)) {
    console.error(`Дубликат id: ${item.id}`);
    process.exit(1);
  }
  ids.add(item.id);
}

for (const dir of targets) {
  mkdirSync(dir, { recursive: true });
}

for (const [index, item] of items.entries()) {
  const svg = svgFor(item, index);
  for (const dir of targets) {
    writeFileSync(join(dir, `${item.id}.svg`), svg);
  }
}

console.log(`Сгенерировано ${items.length} уникальных значков в ${targets.length} приложениях`);
