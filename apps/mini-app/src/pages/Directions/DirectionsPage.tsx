import { motion } from 'framer-motion';
import { PageHeader } from '../../widgets/PageHeader/PageHeader';
import { club } from '../../shared/config/club';
import { goldButtonStyle } from '../../shared/ui/figma';

const WAY_1 = [
  'Встаньте лицом к адресу ул. Миллионная, 19.',
  'Поверните налево и дойдите до перекрестка.',
  'Поверните направо на Мошков переулок.',
  'Идите прямо до арки с вывеской кафе “Бредли”.',
  'Зайдите в арку, пройдите прямо до конца и поверните направо.',
  'Идите до конца - справа, под черной лестницей, находится вход в Gutshot.',
];

const WAY_2 = [
  'Встаньте лицом к адресу ул. Миллионная, 19.',
  'Зайдите в арку справа.',
  'На домофоне нажмите кнопку “Gutshot”.',
  'После открытия двери пройдите прямо, затем поверните налево.',
  'Идите до конца - справа, под черной лестницей, будет вход в клуб.',
];

function StepList({ steps }: { steps: string[] }): JSX.Element {
  return (
    <ol className="flex flex-col gap-2.5 m-0 p-0 list-none">
      {steps.map((step, index) => (
        <li key={step} className="flex items-start gap-3">
          <span
            className="sans shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: 24,
              height: 24,
              marginTop: 1,
              fontSize: 11,
              fontWeight: 600,
              color: '#0A0A0A',
              background: 'linear-gradient(135deg, #C89A3D, #F7D98A)',
            }}
          >
            {index + 1}
          </span>
          <span className="sans" style={{ fontSize: 13, lineHeight: 1.55, color: '#D8CEBC' }}>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

function WayCard({
  title,
  steps,
  delay,
}: {
  title: string;
  steps: string[];
  delay: number;
}): JSX.Element {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="vip-card rounded-[20px] p-4 flex flex-col gap-3"
    >
      <h2 className="serif font-semibold" style={{ fontSize: 17, color: '#F5EDD6' }}>
        {title}
      </h2>
      <StepList steps={steps} />
    </motion.section>
  );
}

export function DirectionsPage(): JSX.Element {
  return (
    <PageHeader title="Как найти Gutshot?" subtitle="Два удобных способа попасть к нам">
      <div className="flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="vip-card overflow-hidden rounded-[20px]"
        >
          <img
            src="/how-to-find.jpg"
            alt="Как найти Gutshot — схема входа"
            className="w-full block"
            style={{ maxHeight: 280, objectFit: 'cover', background: '#14110c' }}
            onError={(event) => {
              const img = event.currentTarget;
              if (!img.dataset.fallback) {
                img.dataset.fallback = '1';
                img.src = '/how-to-find.svg';
              }
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="vip-card rounded-[20px] px-4 py-3.5"
        >
          <p
            className="sans uppercase"
            style={{ fontSize: 9, color: '#6B614E', letterSpacing: '0.18em' }}
          >
            Адрес
          </p>
          <p className="serif font-semibold mt-1" style={{ fontSize: 16, color: '#F5EDD6' }}>
            {club.addressFull}
          </p>
        </motion.div>

        <p className="sans" style={{ fontSize: 13, lineHeight: 1.65, color: '#B6A98F' }}>
          Есть два удобных способа попасть к нам.
        </p>

        <WayCard title="Способ 1" steps={WAY_1} delay={0.1} />
        <WayCard title="Способ 2" steps={WAY_2} delay={0.16} />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="sans text-center"
          style={{ fontSize: 14, color: '#C89A3D', letterSpacing: '0.04em' }}
        >
          Ждем вас! ♠️
        </motion.p>

        <motion.a
          href={club.mapsUrl}
          target="_blank"
          rel="noreferrer"
          whileTap={{ scale: 0.975 }}
          className="btn-shine sans font-semibold uppercase rounded-full flex items-center justify-center"
          style={{ ...goldButtonStyle(), height: 52 }}
        >
          Открыть на карте
        </motion.a>
      </div>
    </PageHeader>
  );
}
