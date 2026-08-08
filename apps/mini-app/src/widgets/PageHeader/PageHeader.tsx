import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Divider } from '../../shared/ui/figma';
import { BackButton } from '../../shared/ui/BackButton';

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 deco-lines pointer-events-none" style={{ zIndex: 0 }} />
      <div
        className="flex flex-col px-5 pb-8 gap-4"
        style={{ paddingTop: 8, position: 'relative', zIndex: 1 }}
      >
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="gold-text serif font-semibold uppercase"
            style={{ fontSize: 26, letterSpacing: '0.05em', lineHeight: 1.15 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="sans mt-1" style={{ fontSize: 11.5, color: '#6B614E' }}>
              {subtitle}
            </p>
          )}
        </motion.div>

        <Divider />

        {children}
      </div>
    </div>
  );
}
