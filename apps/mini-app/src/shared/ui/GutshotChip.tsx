import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

export interface GutshotChipProps {
  size?: number;
  className?: string;
  /** Задержка старта подброса (сек) */
  tossDelay?: number;
  /** Повторять подброс */
  loop?: boolean;
}

/** Плоская фишка для декора — фото физической фишки клуба. */
export function GutshotChipDecor({
  size = 96,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}): JSX.Element {
  return (
    <img
      src="/gutshot-chip-photo.png"
      alt=""
      aria-hidden
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}

function ChipFace({ mirrored = false }: { mirrored?: boolean }): JSX.Element {
  return (
    <img
      src="/gutshot-chip-photo.png"
      alt=""
      aria-hidden
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        transform: mirrored ? 'scaleX(-1)' : undefined,
      }}
    />
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
          const green = t < 0.15 || t > 0.85 ? '#1E9A58' : '#2EBF71';
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
          <ChipFace />
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
          <ChipFace mirrored />
        </div>
      </motion.div>
    </div>
  );
}
