import { motion } from 'framer-motion';
import { PageHeader } from '../../widgets/PageHeader/PageHeader';
import { goldButtonStyle } from '../../shared/ui/figma';
import { club } from '../../shared/config/club';

const TOPICS = [
  'Не приходит подтверждение регистрации на турнир',
  'Нужно отменить или перенести запись',
  'Вопрос по начислению XP и рейтингу',
  'Проблема со входом в приложение',
];

export function SupportPage(): JSX.Element {
  return (
    <PageHeader title="Поддержка" subtitle={`${club.supportUsername} — отвечаем в течение дня`}>
      <div className="flex flex-col gap-3">
        <p className="sans" style={{ fontSize: 13, lineHeight: 1.7, color: '#B6A98F' }}>
          Напишите в чат поддержки {club.supportUsername} — поможем с регистрацией, рейтингом и
          любыми вопросами по турнирам.
        </p>

        <div className="flex flex-col gap-2 mt-1">
          {TOPICS.map((topic, i) => (
            <motion.div
              key={topic}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="vip-card rounded-2xl px-4 py-3 flex items-start gap-3"
            >
              <span style={{ color: 'rgba(199,154,61,0.6)', fontSize: 12, lineHeight: 1.5 }}>
                ◆
              </span>
              <span className="sans" style={{ fontSize: 12.5, color: '#D8CEBC', lineHeight: 1.5 }}>
                {topic}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.a
          href={club.supportUrl}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.975 }}
          className="btn-shine sans font-semibold uppercase rounded-full flex items-center justify-center mt-2"
          style={{ ...goldButtonStyle(), height: 52 }}
        >
          Написать {club.supportUsername}
        </motion.a>
      </div>
    </PageHeader>
  );
}
