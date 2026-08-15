import { AnimatePresence, motion } from 'framer-motion';
import type { LegalDocumentDto } from '@gutshot/types';
import { LEGAL_DOCUMENT_PAGES } from '../../shared/config/legal-document-pages';

export function LegalDocumentSheet({
  document,
  onClose,
}: {
  document: LegalDocumentDto | null;
  onClose: () => void;
}): JSX.Element {
  const pages = document ? (LEGAL_DOCUMENT_PAGES[document.type] ?? []) : [];

  return (
    <AnimatePresence>
      {document && (
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
            className="vip-card-hero w-full rounded-t-[28px] px-5 pt-6 pb-8 relative overflow-hidden flex flex-col"
            style={{ maxWidth: 430, maxHeight: '88vh' }}
          >
            <div
              className="mx-auto mb-4 rounded-full shrink-0"
              style={{ width: 42, height: 4, background: 'rgba(199,154,61,0.35)' }}
            />

            <h2
              className="serif font-semibold mb-3 shrink-0"
              style={{ fontSize: 19, color: '#F5EDD6' }}
            >
              {document.title}
            </h2>

            <div className="hs overflow-y-auto flex-1">
              {pages.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {pages.map((src, index) => (
                    <img
                      key={src}
                      src={src}
                      alt={`${document.title}, стр. ${index + 1}`}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: 10,
                        background: '#fff',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p
                  className="sans whitespace-pre-wrap"
                  style={{ fontSize: 12.5, lineHeight: 1.7, color: '#B6A98F' }}
                >
                  {document.content}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="shrink-0 w-full mt-5 py-3.5 rounded-[16px] sans font-medium"
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
