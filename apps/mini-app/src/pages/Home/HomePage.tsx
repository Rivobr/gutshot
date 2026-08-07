import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@gutshot/ui';
import { HomeTile } from '../../widgets/HomeTile/HomeTile';
import { RatingBanner } from '../../widgets/RatingBanner/RatingBanner';
import { TournamentLiveBlock } from '../../widgets/TournamentLive/TournamentLiveBlock';
import { useNearestTournament } from '../../entities/tournament';
import { useCurrentRegistration } from '../../entities/registration';
import { SuitWatermark, goldButtonStyle } from '../../shared/ui/figma';
import { PlayersFillBar } from '../../shared/ui/PlayersFillBar';
import { club, clubLegalLine } from '../../shared/config/club';
import { formatDateShort, formatTime } from '../../shared/lib/format';

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
  const { data: registrations = [] } = useCurrentRegistration();

  const taken = nearest?._count?.registrations ?? 0;
  const isRegistered = Boolean(nearest && registrations.some((r) => r.tournamentId === nearest.id));

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 deco-lines pointer-events-none" style={{ zIndex: 0 }} />

      <div
        className="flex flex-col px-4 pb-6 gap-4"
        style={{ paddingTop: 12, position: 'relative', zIndex: 1 }}
      >
        {isLoading ? (
          <Loader />
        ) : nearest ? (
          <motion.button
            type="button"
            onClick={() => navigate(`/tournaments/${nearest.id}`)}
            initial={{ opacity: 0, y: 22 }}
            animate={{
              opacity: 1,
              y: 0,
              boxShadow: [
                '0 0 0 1px rgba(199,154,61,0.22), 0 0 0 rgba(199,154,61,0)',
                '0 0 0 1px rgba(199,154,61,0.55), 0 0 28px rgba(199,154,61,0.28)',
                '0 0 0 1px rgba(199,154,61,0.22), 0 0 0 rgba(199,154,61,0)',
              ],
            }}
            transition={{
              opacity: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
              y: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
              boxShadow: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileTap={{ scale: 0.985 }}
            className="vip-card-hero relative overflow-hidden rounded-[22px] w-full text-left"
            style={{ border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {nearest.imageUrl && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${nearest.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.2,
                }}
              />
            )}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-1/3"
              initial={{ x: '-120%', opacity: 0 }}
              animate={{ x: ['-120%', '220%'], opacity: [0, 0.55, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
              style={{
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(247,217,138,0.16) 45%, transparent 70%)',
                zIndex: 2,
              }}
            />

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

            <div className="relative p-5" style={{ zIndex: 3 }}>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <motion.span
                  className="sans inline-flex items-center gap-1.5 rounded-full px-3"
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    height: 30,
                    fontSize: 11,
                    color: '#0A0A0A',
                    background: 'linear-gradient(135deg, #C89A3D, #F7D98A)',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                  }}
                >
                  {nearest.status === 'IN_PROGRESS' ? '● Идёт' : '● Скоро'}
                </motion.span>
                <Chip icon="🕐">{`${formatDateShort(nearest.date)} / ${formatTime(nearest.date)}`}</Chip>
              </div>

              <p
                className="sans uppercase"
                style={{ fontSize: 9, color: '#8E7A55', letterSpacing: '0.22em' }}
              >
                Турнир
              </p>

              <div className="flex items-end justify-between gap-3 mt-1.5 mb-4">
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

                <motion.span
                  className="btn-shine sans font-semibold rounded-full shrink-0 px-6 inline-flex items-center justify-center"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ ...goldButtonStyle(), height: 44, fontSize: 12, letterSpacing: '0.1em' }}
                >
                  {isRegistered ? 'Вы записаны' : 'Записаться'}
                </motion.span>
              </div>

              <PlayersFillBar taken={taken} max={nearest.maxPlayers} />
            </div>
          </motion.button>
        ) : (
          <div className="vip-card rounded-[22px] p-6 text-center">
            <p className="sans" style={{ fontSize: 12, color: '#6B614E' }}>
              Ближайших турниров пока нет
            </p>
          </div>
        )}

        {/* Табло на главной — для тех, кто записан или уже отметился в клубе. */}
        {nearest?.live && isRegistered && <TournamentLiveBlock live={nearest.live} />}

        <RatingBanner delay={0.15} />

        <div className="grid grid-cols-2 gap-3">
          <HomeTile title="Чат клуба" suit="spade" href={club.chatUrl} delay={0.18} />
          <HomeTile title="Как найти" suit="diamond" to="/directions" delay={0.2} />
          <HomeTile title="Правила" suit="club" to="/rules" delay={0.22} />
          <HomeTile title="О клубе" suit="heart" to="/about" delay={0.24} />
          <HomeTile title="Поддержка" suit="heart" to="/support" delay={0.26} />
          <HomeTile title="Q&A" suit="club" to="/faq" delay={0.28} />
        </div>

        <div className="flex flex-col items-center gap-1.5 pt-3 px-2">
          <p
            className="sans text-center"
            style={{ fontSize: 10, color: '#6B614E', letterSpacing: '0.04em', lineHeight: 1.45 }}
          >
            {clubLegalLine()}
          </p>
          <a
            href={`tel:${club.phoneTel}`}
            className="sans"
            style={{ fontSize: 11, color: '#C89A3D', textDecoration: 'none' }}
          >
            {club.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
