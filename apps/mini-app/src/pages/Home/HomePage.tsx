import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import { HomeTile } from '../../widgets/HomeTile/HomeTile';
import { RatingBanner } from '../../widgets/RatingBanner/RatingBanner';
import { useNearestTournament } from '../../entities/tournament';
import { useCurrentRegistration } from '../../entities/registration';
import { Logo, SuitWatermark, goldButtonStyle } from '../../shared/ui/figma';
import { club } from '../../shared/config/club';
import { formatDateShort, formatMoney, formatTime, seatsWord } from '../../shared/lib/format';

function Chip({ icon, children }: { icon: string; children: string }): JSX.Element {
  return (
    <span
      className="sans inline-flex items-center gap-1.5 rounded-full px-3"
      style={{
        height: 30,
        fontSize: 11,
        color: '#E7DCC4',
        background: 'rgba(9,9,9,0.55)',
        border: '1px solid rgba(199,154,61,0.3)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{ opacity: 0.75 }}>{icon}</span>
      {children}
    </span>
  );
}

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const { data: nearest, isLoading } = useNearestTournament();
  const { data: registration } = useCurrentRegistration();

  const taken = nearest?._count?.registrations ?? 0;
  const seatsLeft = nearest ? Math.max(nearest.maxPlayers - taken, 0) : 0;

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 deco-lines pointer-events-none" style={{ zIndex: 0 }} />

      <div
        className="flex flex-col px-4 pb-6 gap-4"
        style={{ paddingTop: 18, position: 'relative', zIndex: 1 }}
      >
        {/* Логотип-шапка */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center pb-1"
        >
          <Logo size="sm" />
        </motion.div>

        {/* Ближайший турнир */}
        {isLoading ? (
          <Loader />
        ) : nearest ? (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="vip-card-hero relative overflow-hidden rounded-[22px]"
          >
            <div className="absolute inset-0 deco-lines opacity-50 pointer-events-none" />
            <SuitWatermark
              suit="spade"
              style={{
                position: 'absolute',
                right: -18,
                top: -12,
                width: 172,
                height: 172,
                opacity: 0.1,
                transform: 'rotate(14deg)',
                pointerEvents: 'none',
              }}
            />

            <div className="relative p-5">
              <div className="flex flex-wrap gap-2 mb-5">
                <Chip icon="👤">{`${seatsLeft} ${seatsWord(seatsLeft)}`}</Chip>
                <Chip icon="🕐">{`${formatDateShort(nearest.date)} / ${formatTime(nearest.date)}`}</Chip>
              </div>

              <p
                className="sans uppercase"
                style={{ fontSize: 9, color: '#8E7A55', letterSpacing: '0.22em' }}
              >
                Турнир
              </p>

              <div className="flex items-end justify-between gap-3 mt-1.5">
                <div className="min-w-0">
                  <h2
                    className="serif font-semibold uppercase"
                    style={{ fontSize: 28, lineHeight: 1.05, color: '#F5EDD6', letterSpacing: '0.02em' }}
                  >
                    {nearest.title}
                  </h2>
                  <p className="gold-text-sm num font-semibold mt-2" style={{ fontSize: 15 }}>
                    {formatMoney(nearest.buyIn)}
                  </p>
                </div>

                <motion.button
                  type="button"
                  onClick={() => navigate(`/tournaments/${nearest.id}`)}
                  whileTap={{ scale: 0.96 }}
                  className="btn-shine sans font-semibold rounded-full shrink-0 px-6"
                  style={{ ...goldButtonStyle(), height: 44, fontSize: 12, letterSpacing: '0.1em' }}
                >
                  Записаться
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="vip-card rounded-[22px] p-6 text-center">
            <p className="sans" style={{ fontSize: 12, color: '#6B614E' }}>
              Ближайших турниров пока нет
            </p>
          </div>
        )}

        {/* Мой билет — если игрок зарегистрирован */}
        {registration && (
          <motion.button
            type="button"
            onClick={() => navigate('/my-tournament')}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileTap={{ scale: 0.982 }}
            className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
          >
            <span className="flex flex-col items-start">
              <span
                className="sans uppercase"
                style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
              >
                Вы зарегистрированы
              </span>
              <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
                Мой билет и QR
              </span>
            </span>
            <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
          </motion.button>
        )}

        {/* Рейтинг */}
        <RatingBanner delay={0.15} />

        {/* Плитки */}
        <div className="grid grid-cols-2 gap-3">
          <HomeTile title="О клубе" suit="diamond" to="/about" delay={0.2} />
          <HomeTile title="Support" suit="heart" to="/support" delay={0.25} />
          <HomeTile title="Q&A" suit="club" to="/faq" wide delay={0.3} />
        </div>

        {/* Подвал */}
        <div className="flex flex-col items-center gap-2 pt-3">
          <Logo size="sm" />
          <p
            className="sans text-center"
            style={{ fontSize: 10, color: '#3E3428', letterSpacing: '0.06em' }}
          >
            {club.address} · {club.city}
          </p>
        </div>
      </div>
    </div>
  );
}
