import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import { HomeTile } from '../../widgets/HomeTile/HomeTile';
import { RatingBanner } from '../../widgets/RatingBanner/RatingBanner';
import { useNearestTournament } from '../../entities/tournament';
import { useCurrentRegistration } from '../../entities/registration';
import { SuitWatermark, goldButtonStyle } from '../../shared/ui/figma';
import { club } from '../../shared/config/club';
import { formatDateShort, formatTime, seatsWord } from '../../shared/lib/format';

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
        style={{ paddingTop: 8, position: 'relative', zIndex: 1 }}
      >
        {isLoading ? (
          <Loader />
        ) : nearest ? (
          <motion.button
            type="button"
            onClick={() => navigate(`/tournaments/${nearest.id}`)}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.985 }}
            className="vip-card-hero relative overflow-hidden rounded-[22px] w-full text-left"
            style={{ border: 'none', cursor: 'pointer', padding: 0 }}
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
                    style={{
                      fontSize: 28,
                      lineHeight: 1.05,
                      color: '#F5EDD6',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {nearest.title}
                  </h2>
                </div>

                <span
                  className="btn-shine sans font-semibold rounded-full shrink-0 px-6 inline-flex items-center justify-center"
                  style={{ ...goldButtonStyle(), height: 44, fontSize: 12, letterSpacing: '0.1em' }}
                >
                  {registration?.tournamentId === nearest.id ? 'Вы записаны' : 'Записаться'}
                </span>
              </div>
            </div>
          </motion.button>
        ) : (
          <div className="vip-card rounded-[22px] p-6 text-center">
            <p className="sans" style={{ fontSize: 12, color: '#6B614E' }}>
              Ближайших турниров пока нет
            </p>
          </div>
        )}

        <RatingBanner delay={0.15} />

        <div className="grid grid-cols-2 gap-3">
          <HomeTile title="О клубе" suit="diamond" to="/about" delay={0.2} />
          <HomeTile title="Поддержка" suit="heart" to="/support" delay={0.25} />
          <HomeTile title="Q&A" suit="club" to="/faq" wide delay={0.3} />
        </div>

        <div className="flex flex-col items-center gap-2 pt-3">
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
