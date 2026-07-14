import { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      {icon && <div className="text-4xl">{icon}</div>}
      <p className="text-foreground font-medium">{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  );
}
