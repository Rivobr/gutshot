import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../widgets/PageHeader/PageHeader';
import { InfoCard, Logo } from '../../shared/ui/figma';
import { club } from '../../shared/config/club';

const PARAGRAPHS = [
  'GUTSHOT — клуб спортивного покера в Санкт-Петербурге. Мы проводим регулярные турниры по правилам спортивного покера: без ставок на деньги, с зачётом очков в клубный рейтинг.',
  'В клубе действует система уровней и опыта: за участие, финальные столы и победы игрок получает XP, поднимается в ранге и открывает доступ к закрытым сериям.',
];

export function AboutPage(): JSX.Element {
  return (
    <PageHeader title="О клубе" subtitle={club.fullName}>
      <div className="flex flex-col gap-4">
        {PARAGRAPHS.map((text, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="sans"
            style={{ fontSize: 13, lineHeight: 1.7, color: '#B6A98F' }}
          >
            {text}
          </motion.p>
        ))}

        <div className="grid grid-cols-2 gap-3 mt-1">
          <InfoCard icon="📍" label="Адрес" value={club.address} />
          <InfoCard icon="🏙" label="Город" value={club.city} />
        </div>

        <Link
          to="/directions"
          className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex flex-col">
            <span
              className="sans uppercase"
              style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
            >
              Маршрут
            </span>
            <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
              Как найти Gutshot
            </span>
          </span>
          <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
        </Link>

        <Link
          to="/rules"
          className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex flex-col">
            <span
              className="sans uppercase"
              style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
            >
              Документы
            </span>
            <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
              Правила клуба
            </span>
          </span>
          <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
        </Link>

        <a
          href={club.channelUrl}
          target="_blank"
          rel="noreferrer"
          className="vip-card rounded-[18px] px-5 py-4 flex items-center justify-between"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex flex-col">
            <span
              className="sans uppercase"
              style={{ fontSize: 8.5, color: '#6B614E', letterSpacing: '0.18em' }}
            >
              Telegram
            </span>
            <span className="serif font-semibold" style={{ fontSize: 15, color: '#F5EDD6' }}>
              Канал клуба
            </span>
          </span>
          <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 20 }}>›</span>
        </a>

        <div className="flex justify-center pt-4">
          <Logo size="md" />
        </div>
      </div>
    </PageHeader>
  );
}
