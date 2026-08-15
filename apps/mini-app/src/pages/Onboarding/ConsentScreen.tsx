import { useState } from 'react';
import { isAxiosError } from 'axios';
import { motion } from 'framer-motion';
import type { LegalDocumentDto, LegalDocumentType } from '@gutshot/types';
import { Logo, goldButtonStyle } from '../../shared/ui/figma';
import { useAcceptConsent, useLegalDocuments } from '../../entities/player';
import { LegalDocumentSheet } from '../../widgets/LegalDocumentSheet/LegalDocumentSheet';
import { resolveLegalDocument } from '../../shared/config/legal-document-pages';

const DOCUMENT_LINKS: { type: LegalDocumentType; label: string }[] = [
  { type: 'USER_AGREEMENT', label: 'публичную оферту' },
  { type: 'CLUB_RULES', label: 'правила клуба' },
  { type: 'PERSONAL_DATA_CONSENT', label: 'политику обработки персональных данных' },
  { type: 'MEDIA_CONSENT', label: 'согласие на фото- и видеосъёмку' },
];

export function ConsentScreen(): JSX.Element {
  const { data: documents } = useLegalDocuments();
  const acceptConsent = useAcceptConsent();
  const [openDocument, setOpenDocument] = useState<LegalDocumentDto | null>(null);

  const documentsByType = new Map<LegalDocumentType, LegalDocumentDto>(
    (documents ?? []).map((document) => [document.type, document]),
  );

  return (
    <div className="flex justify-center min-h-screen" style={{ background: '#000' }}>
      <div
        className="relative flex flex-col overflow-hidden"
        style={{ width: '100%', maxWidth: 430, minHeight: '100dvh', background: '#090909' }}
      >
        {/* Переливающийся фон */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div
            className="aurora-a absolute"
            style={{
              inset: '-25%',
              background:
                'radial-gradient(closest-side, rgba(199,154,61,0.32) 0%, rgba(156,106,31,0.12) 45%, transparent 72%)',
              filter: 'blur(48px)',
            }}
          />
          <div
            className="aurora-b absolute"
            style={{
              inset: '-30%',
              background:
                'radial-gradient(closest-side, rgba(224,17,95,0.16) 0%, rgba(122,11,44,0.08) 50%, transparent 75%)',
              filter: 'blur(56px)',
            }}
          />
          <div className="absolute inset-0 deco-lines opacity-60" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(9,9,9,0.35) 0%, rgba(9,9,9,0.1) 40%, rgba(9,9,9,0.92) 100%)',
            }}
          />
        </div>

        {/* Логотип по центру */}
        <div className="relative flex-1 flex items-center justify-center px-8" style={{ zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="logo-breathe"
          >
            <Logo size="lg" />
          </motion.div>
        </div>

        {/* Кнопка и юридический блок */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative px-6"
          style={{ zIndex: 1, paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
        >
          <motion.button
            type="button"
            onClick={() => acceptConsent.mutate()}
            disabled={acceptConsent.isPending}
            whileTap={{ scale: 0.975 }}
            className="btn-shine sans font-semibold uppercase w-full rounded-full"
            style={{ ...goldButtonStyle(), height: 54, opacity: acceptConsent.isPending ? 0.7 : 1 }}
          >
            {acceptConsent.isPending ? 'Сохраняем…' : 'Согласен'}
          </motion.button>

          {acceptConsent.isError && (
            <p className="sans text-center mt-3" style={{ fontSize: 11, color: '#C0392B' }}>
              {(() => {
                const err = acceptConsent.error;
                if (isAxiosError(err)) {
                  const msg = err.response?.data?.message;
                  if (typeof msg === 'string' && msg.trim()) {
                    return msg;
                  }
                  if (!err.response) {
                    return 'Нет связи с сервером. Проверьте интернет и нажмите ещё раз.';
                  }
                }
                return 'Не удалось сохранить согласие. Попробуйте ещё раз.';
              })()}
            </p>
          )}

          <p
            className="sans text-center mt-4"
            style={{ fontSize: 10.5, lineHeight: 1.65, color: '#6B614E' }}
          >
            Нажимая «Согласен», вы принимаете{' '}
            {DOCUMENT_LINKS.map((link, index) => (
              <span key={link.type}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenDocument(
                      resolveLegalDocument(link.type, documentsByType.get(link.type)),
                    )
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    color: '#C89A3D',
                    textDecoration: 'underline',
                    textUnderlineOffset: 2,
                    cursor: 'pointer',
                  }}
                >
                  {link.label}
                </button>
                {index < DOCUMENT_LINKS.length - 2 ? ', ' : ''}
                {index === DOCUMENT_LINKS.length - 2 ? ' и ' : ''}
                {index === DOCUMENT_LINKS.length - 1 ? '.' : ''}
              </span>
            ))}
          </p>
        </motion.div>

        <LegalDocumentSheet document={openDocument} onClose={() => setOpenDocument(null)} />
      </div>
    </div>
  );
}
