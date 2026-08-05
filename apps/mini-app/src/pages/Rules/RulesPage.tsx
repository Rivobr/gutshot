import { motion } from 'framer-motion';
import { Loader } from '@gutshot/ui';
import { PageHeader } from '../../widgets/PageHeader/PageHeader';
import { useLegalDocuments } from '../../entities/player';

export function RulesPage(): JSX.Element {
  const { data, isLoading, isError } = useLegalDocuments();
  const rules = data?.find((document) => document.type === 'CLUB_RULES');

  return (
    <PageHeader title="Правила" subtitle="Правила клуба спортивного покера GUTSHOT">
      {isLoading ? (
        <Loader />
      ) : isError || !rules ? (
        <div className="vip-card rounded-[20px] p-5">
          <p className="sans" style={{ fontSize: 13, color: '#B6A98F', lineHeight: 1.6 }}>
            Не удалось загрузить правила. Попробуйте позже или напишите в поддержку.
          </p>
        </div>
      ) : (
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="vip-card rounded-[20px] p-5 flex flex-col gap-3"
        >
          <h2 className="serif font-semibold" style={{ fontSize: 18, color: '#F5EDD6' }}>
            {rules.title}
          </h2>
          <p
            className="sans whitespace-pre-wrap"
            style={{ fontSize: 13, lineHeight: 1.7, color: '#B6A98F' }}
          >
            {rules.content}
          </p>
          <p className="sans pt-1" style={{ fontSize: 10, color: '#6B614E' }}>
            Версия {rules.version}
          </p>
        </motion.article>
      )}
    </PageHeader>
  );
}
