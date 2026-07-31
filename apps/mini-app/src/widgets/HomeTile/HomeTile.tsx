import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SuitWatermark } from '../../shared/ui/figma';

export interface HomeTileProps {
  title: string;
  suit: 'spade' | 'club' | 'diamond' | 'heart';
  to?: string;
  href?: string;
  badge?: string;
  wide?: boolean;
  delay?: number;
}

export function HomeTile({
  title,
  suit,
  to,
  href,
  badge,
  wide = false,
  delay = 0,
}: HomeTileProps): JSX.Element {
  const navigate = useNavigate();

  const open = (): void => {
    if (href) {
      window.open(href, '_blank', 'noreferrer');
      return;
    }
    if (to) navigate(to);
  };

  return (
    <motion.button
      type="button"
      onClick={open}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.975 }}
      className={`vip-card relative overflow-hidden rounded-[20px] text-left ${wide ? 'col-span-2' : ''}`}
      style={{ height: wide ? 108 : 148 }}
    >
      <div className="absolute inset-0 deco-lines opacity-40 pointer-events-none" />
      <SuitWatermark
        suit={suit}
        style={{
          position: 'absolute',
          right: wide ? 18 : -6,
          top: wide ? '50%' : 18,
          transform: wide ? 'translateY(-50%) rotate(-8deg)' : 'rotate(-8deg)',
          width: wide ? 56 : 72,
          height: wide ? 56 : 72,
          opacity: 0.22,
          pointerEvents: 'none',
        }}
      />

      {badge && (
        <span
          className="sans absolute rounded-full px-2 py-0.5"
          style={{
            top: 12,
            left: 14,
            fontSize: 8,
            letterSpacing: '0.14em',
            background: 'rgba(199,154,61,0.14)',
            border: '1px solid rgba(199,154,61,0.35)',
            color: '#C89A3D',
          }}
        >
          {badge}
        </span>
      )}

      <span
        className="serif font-semibold uppercase absolute"
        style={{
          left: 16,
          bottom: 14,
          fontSize: 16,
          letterSpacing: '0.08em',
          color: '#F5EDD6',
        }}
      >
        {title}
      </span>
    </motion.button>
  );
}
