import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader } from '../../widgets/PageHeader/PageHeader';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Как записаться на турнир?',
    a: 'Откройте карточку турнира с открытой регистрацией и нажмите «Записаться». Можно быть записанным на несколько турниров сразу.',
  },
  {
    q: 'Чем отличаются очки и XP?',
    a: 'Очки — клубный рейтинг за места в турнирах. XP — опыт уровня: за явку, события и результаты. Уровень растёт от XP, рейтинг — от очков.',
  },
  {
    q: 'Как работает недельный рейтинг и финал месяца?',
    a: 'Каждую неделю идут ежедневные турниры. Топ-7 переносят очки в финал месяца. В августе 1-я неделя — открытие 03–16.08, дальше обычные пн–сб. В финале сумма очков только тех недель, где игрок был в топ-7. Подпись «финалист 2-й недели» — номер недели месяца, а не «одну неделю».',
  },
  {
    q: 'Где мой QR-код?',
    a: 'Постоянный QR-код находится в профиле (кнопка слева сверху). Покажите его администратору — по нему отмечают явку и события турнира.',
  },
  {
    q: 'Как найти клуб?',
    a: 'Откройте плитку «Как найти» на главной — там карта и два подробных маршрута от ул. Миллионная, 19 до входа в Gutshot.',
  },
  {
    q: 'Можно ли отменить регистрацию?',
    a: 'Да. Откройте карточку турнира и нажмите «Отменить регистрацию». Если турнир заполнен, ваше место автоматически перейдёт первому игроку из листа ожидания.',
  },
  {
    q: 'Что делать, если мест нет?',
    a: 'Вы попадёте в лист ожидания. При освобождении места мы уведомим вас в Telegram, и регистрация подтвердится автоматически.',
  },
  {
    q: 'Где правила клуба?',
    a: 'На главной нажмите «Правила». Текст меняется в админ-панели: раздел «Документы» → «Правила клуба».',
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
        <span
          className="sans font-semibold"
          style={{ fontSize: 13, color: '#F5EDD6', lineHeight: 1.4 }}
        >
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
