import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@gutshot/ui';
import type { AdminTournament } from '../../entities/tournament';
import { useCreateTournament, useUpdateTournament } from '../../entities/tournament';

interface FormValues {
  title: string;
  description?: string;
  date: string;
  maxPlayers: number;
  imageUrl?: string;
}

export interface TournamentFormModalProps {
  open: boolean;
  onClose: () => void;
  tournament?: AdminTournament | null;
}

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TournamentFormModal({
  open,
  onClose,
  tournament,
}: TournamentFormModalProps): JSX.Element {
  const isEdit = Boolean(tournament);
  const { register, handleSubmit, reset } = useForm<FormValues>();
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const isPending = createTournament.isPending || updateTournament.isPending;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (tournament) {
      reset({
        title: tournament.title,
        description: tournament.description ?? '',
        date: toLocalInputValue(tournament.date),
        maxPlayers: tournament.maxPlayers,
        imageUrl: tournament.imageUrl ?? '',
      });
      return;
    }

    reset({
      title: '',
      description: '',
      date: '',
      maxPlayers: 30,
      imageUrl: '',
    });
  }, [open, tournament, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      buyIn: 0,
      maxPlayers: Number(values.maxPlayers),
      date: new Date(values.date).toISOString(),
      imageUrl: values.imageUrl?.trim() || undefined,
    };

    if (tournament) {
      updateTournament.mutate(
        { id: tournament.id, payload },
        {
          onSuccess: () => {
            onClose();
          },
        },
      );
      return;
    }

    createTournament.mutate(payload, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md rounded-lg border border-border bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-medium">
              {isEdit ? 'Редактировать турнир' : 'Новый турнир'}
            </h2>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
              <input
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                placeholder="Название"
                {...register('title', { required: true })}
              />
              <textarea
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                placeholder="Описание (абзацы через Enter)"
                rows={12}
                {...register('description')}
              />
              <input
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                placeholder="URL фото / обложки"
                {...register('imageUrl')}
              />
              <input
                type="datetime-local"
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                {...register('date', { required: true })}
              />
              <input
                type="number"
                min={2}
                className="rounded-md border border-border bg-secondary px-3 py-2.5"
                placeholder="Максимум игроков"
                {...register('maxPlayers', { required: true, min: 2 })}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Отмена
                </Button>
                <Button type="submit" isLoading={isPending}>
                  {isEdit ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
