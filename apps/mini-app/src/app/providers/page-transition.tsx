import { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }: PropsWithChildren): JSX.Element {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
