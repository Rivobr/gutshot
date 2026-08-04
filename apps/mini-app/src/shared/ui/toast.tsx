import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

let toastId = 0;
const listeners = new Set<(items: ToastItem[]) => void>();
let queue: ToastItem[] = [];

function emit(): void {
  for (const listener of listeners) {
    listener([...queue]);
  }
}

export function showToast(message: string, kind: ToastKind = 'success'): void {
  const id = ++toastId;
  queue = [...queue, { id, message, kind }];
  emit();
  window.setTimeout(() => {
    queue = queue.filter((item) => item.id !== id);
    emit();
  }, 3200);
}

const KIND_STYLE: Record<ToastKind, { bg: string; border: string; color: string }> = {
  success: {
    bg: 'linear-gradient(145deg, rgba(199,154,61,0.22), rgba(14,12,9,0.96))',
    border: 'rgba(247,217,138,0.45)',
    color: '#F5EDD6',
  },
  error: {
    bg: 'linear-gradient(145deg, rgba(192,57,43,0.22), rgba(14,12,9,0.96))',
    border: 'rgba(224,122,110,0.45)',
    color: '#F0C8C2',
  },
  info: {
    bg: 'linear-gradient(145deg, rgba(90,110,140,0.22), rgba(14,12,9,0.96))',
    border: 'rgba(160,180,210,0.35)',
    color: '#E7DCC4',
  },
};

export function ToastHost(): JSX.Element | null {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    setItems([...queue]);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-[200] flex flex-col items-center gap-2 px-4"
      style={{ bottom: 'max(18px, env(safe-area-inset-bottom))' }}
    >
      <AnimatePresence>
        {items.map((item) => {
          const style = KIND_STYLE[item.kind];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="sans pointer-events-auto w-full max-w-sm rounded-[16px] px-4 py-3 text-center"
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                color: style.color,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
              }}
            >
              {item.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
