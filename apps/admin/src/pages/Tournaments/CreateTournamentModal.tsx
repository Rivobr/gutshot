import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@gutshot/ui';
import { useCreateTournament } from '../../entities/tournament';

interface FormValues {
  title: string;
  description?: string;
  date: string;
  buyIn: number;
  maxPlayers: number;
}

export interface CreateTournamentModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTournamentModal({ open, onClose }: CreateTournamentModalProps): JSX.Element {
  const { register, handleSubmit, reset } = useForm<FormValues>();
  const createTournament = useCreateTournament();

  const onSubmit = (values: FormValues) => {
    createTournament.mutate(
      {
        ...values,
        buyIn: Number(values.buyIn),
        maxPlayers: Number(values.maxPlayers),
        date: new Date(values.date).toISOString(),
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md rounded-lg border border-border bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-medium">Новый турнир</h2>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
              <input
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                placeholder="Название"
                {...register('title', { required: true })}
              />
              <textarea
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                placeholder="Описание"
                {...register('description')}
              />
              <input
                type="datetime-local"
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                {...register('date', { required: true })}
              />
              <input
                type="number"
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                placeholder="Бай-ин"
                {...register('buyIn', { required: true })}
              />
              <input
                type="number"
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                placeholder="Максимум игроков"
                {...register('maxPlayers', { required: true })}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Отмена
                </Button>
                <Button type="submit" isLoading={createTournament.isPending}>
                  Создать
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
