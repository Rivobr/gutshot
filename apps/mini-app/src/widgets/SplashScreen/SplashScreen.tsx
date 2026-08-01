import { motion } from 'framer-motion';
import { BrandMark } from '../../shared/ui/figma';

export function SplashScreen({
  subtitle = 'Загружаем клуб…',
}: {
  subtitle?: string;
}): JSX.Element {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: '#090909' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 28%, rgba(199,154,61,0.18) 0%, transparent 55%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 deco-lines opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center"
      >
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BrandMark height={34} />
        </motion.div>

        <h1
          className="serif font-semibold gold-text mt-5"
          style={{ fontSize: 34, letterSpacing: '0.18em', lineHeight: 1 }}
        >
          GUTSHOT
        </h1>
        <p
          className="sans uppercase mt-2"
          style={{
            fontSize: 11,
            color: 'rgba(199,154,61,0.55)',
            letterSpacing: '0.34em',
          }}
        >
          Poker Club
        </p>

        <div className="mt-10 w-44">
          <div
            className="rounded-full overflow-hidden"
            style={{ height: 3, background: 'rgba(199,154,61,0.12)' }}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '45%',
                height: '100%',
                borderRadius: 99,
                background: 'linear-gradient(90deg, transparent, #C89A3D, #F7D98A, transparent)',
              }}
            />
          </div>
          <p
            className="sans text-center mt-4"
            style={{ fontSize: 13, color: '#8A7A62', letterSpacing: '0.04em' }}
          >
            {subtitle}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
