import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import { usePlayerQrCode } from '../../entities/player';
import { Logo } from '../../shared/ui/figma';

export interface MyQrModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Постоянный QR-код игрока. Код выдается один раз при регистрации
 * и не меняется при изменении профиля, поэтому изображение можно кешировать.
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="vip-card-hero w-full rounded-t-[28px] px-6 pt-6 pb-9 relative overflow-hidden"
            style={{ maxWidth: 430 }}
          >
            <div className="absolute inset-0 deco-lines opacity-40 pointer-events-none" />
            <div
              className="mx-auto mb-5 rounded-full"
              style={{ width: 42, height: 4, background: 'rgba(199,154,61,0.35)' }}
            />

            <div className="relative flex justify-center mb-5">
              <Logo size="sm" />
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
    </AnimatePresence>
  );
}
