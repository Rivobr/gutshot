import { motion } from 'framer-motion';
import { Loader } from '@gutshot/ui';
import { QRCard } from '../../widgets/QRCard/QRCard';
import {
  useCancelRegistration,
  useCurrentQr,
  useCurrentRegistration,
} from '../../entities/registration';
import { GoldBadge, Logo } from '../../shared/ui/figma';
import { formatDate, formatTime } from '../../shared/lib/format';

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: 'Зарегистрирован ✓',
  CHECKED_IN: 'Отметился ✓',
  PLAYING: 'В игре',
  WAITING: 'Лист ожидания',
};

export function MyTournamentPage(): JSX.Element {
  const { data: registration, isLoading } = useCurrentRegistration();
  const { data: qr } = useCurrentQr(registration?.status === 'REGISTERED');
  const cancelMutation = useCancelRegistration();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <Logo size="sm" />
        <h2 className="serif font-semibold mt-4" style={{ fontSize: 24, color: '#F5EDD6' }}>
          Мой турнир
        </h2>
      </div>

      {!registration ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 px-5">
          <span style={{ fontSize: 32, opacity: 0.25 }}>🎫</span>
          <p className="serif" style={{ fontSize: 16, color: '#6B614E', textAlign: 'center' }}>
            Нет активной регистрации
          </p>
          <p className="sans" style={{ fontSize: 12, color: '#3E3428', textAlign: 'center' }}>
            Зарегистрируйтесь на турнир в разделе «Турниры»
          </p>
        </div>
      ) : (
        <div className="px-5 pb-6 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="vip-card-hero rounded-[22px] overflow-hidden relative"
          >
            <div className="absolute inset-0 deco-lines opacity-40 pointer-events-none" />
            <div className="p-6">
              <GoldBadge>{STATUS_LABELS[registration.status] ?? registration.status}</GoldBadge>
              <h3 className="serif font-semibold mt-3 mb-1" style={{ fontSize: 21, color: '#F5EDD6' }}>
                {registration.tournament?.title}
              </h3>
              {registration.tournament && (
                <p className="sans num" style={{ fontSize: 12, color: '#6B614E' }}>
                  {formatDate(registration.tournament.date)} · {formatTime(registration.tournament.date)}
                </p>
              )}
            </div>
          </motion.div>

          {registration.status === 'REGISTERED' && qr && (
            <QRCard token={qr.token} expiresAt={qr.expiresAt} />
          )}

          {registration.status === 'WAITING' && (
            <div className="vip-card rounded-[18px] p-5">
              <p className="sans" style={{ fontSize: 13, color: '#C0B49A', lineHeight: 1.6 }}>
                Вы в листе ожидания. Как только освободится место, мы автоматически переведём вас в
                основной список и пришлём уведомление.
              </p>
            </div>
          )}

          {(registration.status === 'REGISTERED' || registration.status === 'WAITING') && (
            <button
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(registration.id)}
              className="w-full py-4 rounded-[18px] sans font-medium disabled:opacity-50"
              style={{
                background: 'rgba(192,57,43,0.12)',
                border: '1px solid rgba(192,57,43,0.4)',
                color: '#E07A6E',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Отменить регистрацию
            </button>
          )}
        </div>
      )}
    </div>
  );
}
