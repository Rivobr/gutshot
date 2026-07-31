import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Divider } from '../../shared/ui/figma';

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 deco-lines pointer-events-none" style={{ zIndex: 0 }} />
      <div
        className="flex flex-col px-5 pb-8 gap-4"
        style={{ paddingTop: 22, position: 'relative', zIndex: 1 }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="sans self-start"
          style={{ fontSize: 12, color: 'rgba(199,154,61,0.7)', background: 'none', border: 'none' }}
        >
          ‹ Назад
        </button>

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
