import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import { usePlayerQrCode } from '../../entities/player';
import { Logo } from '../../shared/ui/figma';

export interface MyQrModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Постоянный QR-код игрока. Рендерится в document.body,
 * чтобы не ломаться из-за transform/overflow страницы и нижней навигации.
 */
export function MyQrModal({ open, onClose }: MyQrModalProps): JSX.Element {
  const { data, isLoading } = usePlayerQrCode();
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!data?.qrCode) {
      return;
    }

    let cancelled = false;

    QRCode.toDataURL(data.qrCode, { width: 440, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(''));

    return () => {
      cancelled = true;
    };
  }, [data?.qrCode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{
            zIndex: 1000,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(6px)',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="vip-card-hero w-full rounded-[28px] px-6 pt-5 pb-5 relative"
            style={{
              maxWidth: 390,
              maxHeight: 'min(92dvh, 720px)',
              overflowY: 'auto',
            }}
          >
            <div className="absolute inset-0 deco-lines opacity-40 pointer-events-none rounded-[28px]" />

            <div className="relative flex items-center justify-between mb-4">
              <div className="flex-1" />
              <Logo size="sm" />
              <div className="flex-1 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 36,
                    height: 36,
                    border: '1px solid rgba(199,154,61,0.35)',
                    background: 'rgba(199,154,61,0.1)',
                    color: '#C89A3D',
                    fontSize: 18,
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="relative flex justify-center">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl bg-white p-4"
                style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              >
                {dataUrl && !isLoading ? (
                  <img src={dataUrl} alt="Мой QR-код" style={{ width: 208, height: 208 }} />
                ) : (
                  <div
                    className="animate-pulse rounded bg-gray-200"
                    style={{ width: 208, height: 208 }}
                  />
                )}
              </motion.div>
            </div>

            {data?.qrCode && (
              <p
                className="relative sans text-center mt-4 tracking-widest"
                style={{ fontSize: 13, color: '#C89A3D' }}
              >
                {data.qrCode}
              </p>
            )}

            <p
              className="relative sans text-center mt-3"
              style={{ fontSize: 11, color: '#6B614E', lineHeight: 1.6 }}
            >
              Покажите код администратору клуба —
              <br />
              он отметит явку, вылет и ваши комбинации
            </p>

            <button
              type="button"
              onClick={onClose}
              className="relative w-full mt-5 py-3.5 rounded-[16px] sans font-medium"
              style={{
                background: 'rgba(199,154,61,0.1)',
                border: '1px solid rgba(199,154,61,0.3)',
                color: '#C89A3D',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Закрыть
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
