import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GutshotChip } from '../../shared/ui/GutshotChip';

export function RatingBanner({ delay = 0 }: { delay?: number }): JSX.Element {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      onClick={() => navigate('/rating')}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.982 }}
      className="vip-card-hero relative rounded-[22px] w-full text-left"
      style={{ height: 152, overflow: 'visible' }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-[22px] overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 78% 40%, rgba(199,154,61,0.24) 0%, transparent 62%)',
        }}
      />
      <div className="absolute inset-0 deco-lines opacity-50 pointer-events-none rounded-[22px] overflow-hidden" />

      {/* 3D-фишка: подброс и аккуратное приземление */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: 8,
          top: '50%',
          marginTop: -64,
          width: 128,
          height: 128,
          zIndex: 2,
        }}
      >
        <GutshotChip size={120} tossDelay={delay + 0.25} loop />
      </div>

      <div className="relative flex flex-col justify-between h-full p-5" style={{ zIndex: 3 }}>
        <div style={{ maxWidth: '58%' }}>
          <p
            className="sans uppercase"
            style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.2em' }}
          >
            Таблица лидеров
          </p>
          <h2
            className="gold-text serif font-semibold uppercase"
            style={{ fontSize: 27, lineHeight: 1.05, letterSpacing: '0.04em', marginTop: 4 }}
          >
            Рейтинг
          </h2>
        </div>

        <div className="flex items-center">
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 34,
              height: 34,
              border: '1px solid rgba(199,154,61,0.4)',
              background: 'rgba(199,154,61,0.1)',
              color: '#C89A3D',
              fontSize: 16,
            }}
          >
            →
          </span>
        </div>
      </div>
    </motion.button>
  );
}
