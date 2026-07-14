import { EmptyState } from '@gutshot/ui';

export function NotFoundPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <EmptyState icon="🔍" title="Страница не найдена" />
    </div>
  );
}
