import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader } from '../../widgets/PageHeader/PageHeader';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Как записаться на турнир?',
    a: 'Откройте карточку турнира на главной или во вкладке «Турниры» и нажмите «Записаться». Место закрепляется за вами сразу, подтверждение придёт в Telegram.',
  },
  {
    q: 'Что такое XP и уровень?',
    a: 'XP — клубный опыт. Он начисляется за участие в турнирах, выход в призы и победы. По мере накопления XP растёт уровень и позиция в рейтинге клуба.',
  },
  {
    q: 'Где мой QR-код?',
    a: 'Постоянный QR-код находится в профиле. Покажите его администратору — по нему отмечают явку и события турнира.',
  },
  {
    q: 'Можно ли отменить регистрацию?',
    a: 'Да. Откройте «Мой билет» и нажмите отмену. Если турнир заполнен, ваше место автоматически перейдёт первому игроку из листа ожидания.',
  },
  {
    q: 'Что делать, если мест нет?',
    a: 'Вы попадёте в лист ожидания. При освобождении места мы уведомим вас в Telegram, и регистрация подтвердится автоматически.',
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="vip-card rounded-[18px] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
        style={{ background: 'none', border: 'none' }}
      >
        <span className="sans font-semibold" style={{ fontSize: 13, color: '#F5EDD6', lineHeight: 1.4 }}>
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ color: 'rgba(199,154,61,0.7)', fontSize: 18, lineHeight: 1 }}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p
              className="sans px-4 pb-4"
              style={{ fontSize: 12.5, lineHeight: 1.65, color: '#B6A98F' }}
            >
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqPage(): JSX.Element {
  return (
    <PageHeader title="Q&A" subtitle="Частые вопросы игроков">
      <div className="flex flex-col gap-2.5">
        {FAQ.map((item, i) => (
          <FaqItem key={item.q} q={item.q} a={item.a} index={i} />
        ))}
      </div>
    </PageHeader>
  );
}
