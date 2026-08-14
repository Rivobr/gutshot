import { useId, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

export interface GutshotChipProps {
  size?: number;
  className?: string;
  /** Задержка старта подброса (сек) */
  tossDelay?: number;
  /** Повторять подброс */
  loop?: boolean;
}

/** Плоская фишка для декора (фон карточек). */
export function GutshotChipDecor({
  size = 96,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}): JSX.Element {
  const uid = useId().replace(/:/g, '');
  return (
    <div
      className={className}
      aria-hidden
      style={{ width: size, height: size, flexShrink: 0, ...style }}
    >
      <ChipFace id={uid} />
    </div>
  );
}

/**
 * Лицо фишки 1:1 с физической Gutshot:
 * тёмно-зелёный обод, 5 салатовых «лезвий» по часовой, белый центр,
 * логотип бота, POKER CLUB, 10 000.
 */
function ChipFace({ id, mirrored = false }: { id: string; mirrored?: boolean }): JSX.Element {
  return (
    <svg
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-forest`} cx="42%" cy="36%" r="68%">
          <stop offset="0%" stopColor="#1F9A36" />
          <stop offset="55%" stopColor="#157A2C" />
          <stop offset="100%" stopColor="#0A3F18" />
        </radialGradient>
        <linearGradient id={`${id}-lime`} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#8CFF6E" />
          <stop offset="38%" stopColor="#4AE24C" />
          <stop offset="100%" stopColor="#1CB83A" />
        </linearGradient>
        <mask id={`${id}-rim`}>
          <rect width="200" height="200" fill="black" />
          <circle cx="100" cy="100" r="97.2" fill="white" />
          <circle cx="100" cy="100" r="67.8" fill="black" />
        </mask>
        <clipPath id={`${id}-inlay`}>
          <circle cx="100" cy="100" r="64.2" />
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="99.8" fill="#07140A" />
      <circle cx="100" cy="100" r="97.4" fill={`url(#${id}-forest)`} />

      <g mask={`url(#${id}-rim)`}>
        {[0, 72, 144, 216, 288].map((deg) => (
          <path
            key={deg}
            d="M83.16 4.47A97 97 0 0 1 154.24 19.58L144.35 47.14Q115.59 26.64 97.49 28.04Z"
            fill={`url(#${id}-lime)`}
            transform={`rotate(${deg} 100 100)`}
          />
        ))}
      </g>

      <circle cx="100" cy="100" r="67.6" fill="none" stroke="#08180C" strokeWidth="2.6" />
      <circle cx="100" cy="100" r="65.6" fill="none" stroke="#1C1C1C" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="64.4" fill="#F6F3EC" />
      <circle cx="100" cy="100" r="64.4" fill="none" stroke="#D4CFC4" strokeWidth="0.45" />

      <g clipPath={`url(#${id}-inlay)`}>
        <image
          href="/gutshot-logo-chip.png"
          x="54"
          y="36"
          width="92"
          height="73"
          preserveAspectRatio="xMidYMid meet"
        />
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fill="#6B5420"
          style={{
            fontFamily: 'Sora, Arial, Helvetica, sans-serif',
            fontSize: 5.4,
            fontWeight: 600,
            letterSpacing: '0.32em',
          }}
        >
          POKER CLUB
        </text>
        <text
          x="100"
          y="144"
          textAnchor="middle"
          fill="#111111"
          style={{
            fontFamily: 'Sora, Arial, Helvetica, sans-serif',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.06em',
          }}
        >
          10 000
        </text>
      </g>
    </svg>
  );
}

const EDGE_LAYERS = 14;
const THICKNESS = 14;

/**
 * 3D-фишка с анимацией подброса и аккуратного приземления.
 */
export function GutshotChip({
  size = 128,
  className,
  tossDelay = 0.35,
  loop = true,
}: GutshotChipProps): JSX.Element {
  const uid = useId().replace(/:/g, '');
  const half = THICKNESS / 2;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        perspective: 900,
        pointerEvents: 'none',
      }}
    >
      {/* Тень на «столе» — сжимается в полёте */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0.15, scaleX: 0.55, scaleY: 0.55 }}
        animate={{
          opacity: [0.12, 0.05, 0.18, 0.28, 0.22],
          scaleX: [0.55, 0.35, 0.7, 1.05, 0.92],
          scaleY: [0.55, 0.35, 0.7, 1.05, 0.92],
        }}
        transition={{
          duration: 2.4,
          delay: tossDelay,
          ease: [0.22, 0.8, 0.25, 1],
          repeat: loop ? Infinity : 0,
          repeatDelay: loop ? 2.8 : 0,
        }}
        style={{
          position: 'absolute',
          left: '12%',
          right: '12%',
          bottom: -2,
          height: size * 0.14,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)',
          filter: 'blur(3px)',
          transformOrigin: 'center',
        }}
      />

      <motion.div
        initial={{
          y: 36,
          rotateX: 58,
          rotateZ: -18,
          rotateY: -12,
          scale: 0.82,
          opacity: 0,
        }}
        animate={{
          y: [36, -54, -8, 10, 0],
          rotateX: [58, 210, 320, 365, 372],
          rotateZ: [-18, 110, 250, 340, 358],
          rotateY: [-12, 28, -8, 6, 0],
          scale: [0.82, 1.08, 1.0, 1.03, 1],
          opacity: [0, 1, 1, 1, 1],
        }}
        transition={{
          duration: 2.4,
          delay: tossDelay,
          times: [0, 0.32, 0.62, 0.82, 1],
          ease: [0.22, 0.75, 0.2, 1],
          repeat: loop ? Infinity : 0,
          repeatDelay: loop ? 2.8 : 0,
        }}
        style={{
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
      >
        {/* Толщина обода — слои по Z */}
        {Array.from({ length: EDGE_LAYERS }, (_, i) => {
          const t = i / (EDGE_LAYERS - 1);
          const z = -half + t * THICKNESS;
          const green = t < 0.15 || t > 0.85 ? '#0B4A1C' : '#157A2C';
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `radial-gradient(circle at 50% 50%, ${green} 72%, #0d0d0d 73%, #0d0d0d 100%)`,
                transform: `translateZ(${z}px)`,
                backfaceVisibility: 'hidden',
              }}
            />
          );
        })}

        {/* Передняя сторона */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            transform: `translateZ(${half + 0.5}px)`,
            backfaceVisibility: 'hidden',
            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.35)',
          }}
        >
          <ChipFace id={`${uid}-f`} />
        </div>

        {/* Задняя сторона */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            transform: `rotateY(180deg) translateZ(${half + 0.5}px)`,
            backfaceVisibility: 'hidden',
          }}
        >
          <ChipFace id={`${uid}-b`} mirrored />
        </div>
      </motion.div>
    </div>
  );
}
