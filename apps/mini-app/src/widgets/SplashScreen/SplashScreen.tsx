import { motion } from 'framer-motion';

export function SplashScreen({
  subtitle = 'Загружаем клуб…',
}: {
  subtitle?: string;
}): JSX.Element {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: '#000000' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgba(199,154,61,0.12) 0%, transparent 58%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center"
      >
        <motion.img
          src="/gutshot-logo.png"
          alt="GUTSHOT"
          animate={{ opacity: [0.88, 1, 0.88], scale: [0.985, 1, 0.985] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 'min(72vw, 280px)',
            height: 'auto',
            display: 'block',
            filter: 'drop-shadow(0 8px 28px rgba(199,154,61,0.22))',
          }}
        />

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
