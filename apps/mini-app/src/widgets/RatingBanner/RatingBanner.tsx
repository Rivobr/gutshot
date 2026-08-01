import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
      style={{ height: 152, overflow: 'hidden' }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-[22px] overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 78% 40%, rgba(199,154,61,0.24) 0%, transparent 62%)',
        }}
      />
      <div className="absolute inset-0 deco-lines opacity-50 pointer-events-none rounded-[22px] overflow-hidden" />

      <div
        className="relative flex items-center justify-between h-full p-5 gap-4"
        style={{ zIndex: 3 }}
      >
        <div className="min-w-0 flex-1">
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
            <br />
            GUTSHOT
          </h2>
        </div>

        <motion.span
          aria-hidden
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: 56,
            height: 56,
            border: '1px solid rgba(199,154,61,0.45)',
            background:
              'linear-gradient(145deg, rgba(199,154,61,0.22), rgba(156,106,31,0.08))',
            color: '#C89A3D',
            fontSize: 26,
            boxShadow: '0 0 24px rgba(199,154,61,0.18)',
          }}
        >
          →
        </motion.span>
      </div>
    </motion.button>
  );
}
