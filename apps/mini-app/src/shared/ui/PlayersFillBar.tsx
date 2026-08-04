import { motion } from 'framer-motion';

interface PlayersFillBarProps {
  taken: number;
  max: number;
  className?: string;
}

/** Прогресс заполнения турнира: число игроков внутри бара. */
export function PlayersFillBar({ taken, max, className }: PlayersFillBarProps): JSX.Element {
  const safeMax = Math.max(max, 1);
  const pct = Math.min(Math.round((taken / safeMax) * 100), 100);

  return (
    <div className={className}>
      <div
        className="relative overflow-hidden rounded-[14px]"
        style={{
          height: 36,
          background: 'rgba(199,154,61,0.1)',
          border: '1px solid rgba(199,154,61,0.2)',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #9C6A1F, #C89A3D, #F7D98A)',
            opacity: 0.85,
          }}
        />
        <div
          className="relative z-[1] flex h-full items-center justify-center sans font-semibold"
          style={{ fontSize: 13, color: '#F5EDD6', letterSpacing: '0.04em' }}
        >
          Игроки {taken} / {max}
        </div>
      </div>
    </div>
  );
}
