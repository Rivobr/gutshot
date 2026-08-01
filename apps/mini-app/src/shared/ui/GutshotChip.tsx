import { useId } from 'react';
import { motion } from 'framer-motion';

export interface GutshotChipProps {
  size?: number;
  className?: string;
  /** Задержка старта подброса (сек) */
  tossDelay?: number;
  /** Повторять подброс */
  loop?: boolean;
}

/** Лицо фишки — SVG один-в-один с физической фишкой клуба */
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
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4B06A" />
          <stop offset="40%" stopColor="#A07828" />
          <stop offset="100%" stopColor="#6B4A12" />
        </linearGradient>
        <linearGradient id={`${id}-red`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4D5E" />
          <stop offset="45%" stopColor="#E0112F" />
          <stop offset="100%" stopColor="#8A0A1C" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="99.5" fill="#0B0B0B" />
      <circle cx="100" cy="100" r="97" fill="#2FBF3A" />

      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <path
          key={deg}
          d="M100 8.5
             C117.2 9.4 132 16.4 137.5 26.6
             C128.1 32 119.5 40.6 116.4 51.6
             C111.7 40.6 107 33.6 100 29.7
             C93 33.6 88.3 40.6 83.6 51.6
             C80.5 40.6 71.9 32 62.5 26.6
             C68 16.4 82.8 9.4 100 8.5 Z"
          fill="#0A0A0A"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}

      <circle cx="100" cy="100" r="68" fill="none" stroke="#C89A3D" strokeWidth="0.8" opacity="0.5" />
      <circle cx="100" cy="100" r="66.5" fill="#121212" />
      <circle cx="100" cy="100" r="63.5" fill="#FFFFFF" />

      {[82.5, 90.5, 98.5, 106.5, 114.5].map((x, i) => (
        <rect
          key={x}
          x={x}
          y="47.5"
          width="4.4"
          height="15.5"
          rx="1.1"
          fill={i === 2 ? `url(#${id}-red)` : `url(#${id}-gold)`}
        />
      ))}

      <text
        x="100"
        y="80"
        textAnchor="middle"
        fill="#8B6914"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 17.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
        }}
      >
        GUTSHOT
      </text>
      <text
        x="100"
        y="91.5"
        textAnchor="middle"
        fill="#8B6914"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 5.2,
          fontWeight: 600,
          letterSpacing: '0.24em',
        }}
      >
        — POKER CLUB —
      </text>
      <text
        x="100"
        y="124"
        textAnchor="middle"
        fill="#111111"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 22.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        10 000
      </text>
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
          const green = t < 0.15 || t > 0.85 ? '#1F9A2A' : '#2FBF3A';
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
