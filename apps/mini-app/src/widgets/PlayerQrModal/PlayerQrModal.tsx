import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import { TournamentParticipant } from '@gutshot/types';
import { initialsOf } from '../../shared/ui/figma';

export interface PlayerQrModalProps {
  participant: TournamentParticipant | null;
  onClose: () => void;
}

export function PlayerQrModal({ participant, onClose }: PlayerQrModalProps): JSX.Element {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!participant) {
      setDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(participant.qrToken, { width: 440, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(''));
    return () => {
      cancelled = true;
    };
  }, [participant]);

  const name = participant
    ? `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim() || 'Игрок'
    : '';

  return (
    <AnimatePresence>
      {participant && (
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
            onClick={(e) => e.stopPropagation()}
            className="vip-card-hero w-full rounded-t-[28px] px-6 pt-6 pb-9 relative overflow-hidden"
            style={{ maxWidth: 430 }}
          >
            <div className="absolute inset-0 deco-lines opacity-40 pointer-events-none" />
            <div
              className="mx-auto mb-5 rounded-full"
              style={{ width: 42, height: 4, background: 'rgba(199,154,61,0.35)' }}
            />

            <div className="relative flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center serif font-semibold shrink-0"
                style={{
                  background: 'linear-gradient(135deg,#9C6A1F,#C89A3D,#F7D98A)',
                  color: '#0A0A0A',
                  fontSize: 16,
                  boxShadow: '0 0 0 2px rgba(199,154,61,0.25), 0 0 22px rgba(156,106,31,0.3)',
                }}
              >
                {initialsOf(participant.firstName, participant.lastName)}
              </div>
              <div className="min-w-0">
                <p className="serif font-semibold truncate" style={{ fontSize: 17, color: '#F5EDD6' }}>
                  {name}
                </p>
                <p className="sans truncate" style={{ fontSize: 11, color: '#6B614E' }}>
                  {participant.username ? `@${participant.username}` : `Уровень ${participant.level}`}
                </p>
              </div>
            </div>

            <div className="relative flex justify-center">
              <motion.div
                key={participant.qrToken}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl bg-white p-4"
                style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              >
                {dataUrl ? (
                  <img src={dataUrl} alt="Постоянный QR игрока" style={{ width: 208, height: 208 }} />
                ) : (
                  <div className="animate-pulse rounded bg-gray-200" style={{ width: 208, height: 208 }} />
                )}
              </motion.div>
            </div>

            <p className="relative sans text-center mt-5" style={{ fontSize: 11, color: '#6B614E', lineHeight: 1.6 }}>
              Постоянный QR-код игрока для учёта прогресса
              <br />и начисления бонусов в клубе
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
