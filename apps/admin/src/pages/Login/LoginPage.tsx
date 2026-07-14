import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card } from '@gutshot/ui';
import { useAdminLogin } from '../../features/auth/model/use-auth';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage(): JSX.Element {
  const loginMutation = useAdminLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm gap-4">
        <div className="text-center">
          <h1 className="text-xl font-medium text-primary">GUTSHOT CRM</h1>
          <p className="text-sm text-muted-foreground">Вход для сотрудников клуба</p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              className="rounded-md border border-border bg-secondary px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@gutshot.club"
              {...register('email')}
            />
            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Пароль</label>
            <input
              type="password"
              className="rounded-md border border-border bg-secondary px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="********"
              {...register('password')}
            />
            {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
          </div>

          {loginMutation.isError && (
            <p className="text-sm text-destructive">Неверный email или пароль</p>
          )}

          <Button type="submit" isLoading={loginMutation.isPending}>
            Войти
          </Button>
        </form>
      </Card>
    </div>
  );
}
