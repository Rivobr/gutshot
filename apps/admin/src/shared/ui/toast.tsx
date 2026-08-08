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
  }, 4200);
}

const KIND_CLASS: Record<ToastKind, string> = {
  success: 'border-emerald-500/50 bg-emerald-950/95 text-emerald-50',
  error: 'border-destructive/50 bg-red-950/95 text-red-50',
  info: 'border-primary/40 bg-background/95 text-foreground',
};

const KIND_ICON: Record<ToastKind, string> = {
  success: '✓',
  error: '!',
  info: 'i',
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
      style={{ top: 'max(16px, env(safe-area-inset-top))' }}
    >
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${KIND_CLASS[item.kind]}`}
            role="status"
            aria-live="polite"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
              {KIND_ICON[item.kind]}
            </span>
            <p className="whitespace-pre-line text-sm font-medium leading-snug">{item.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
