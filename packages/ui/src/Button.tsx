import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from './lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  ghost: 'bg-transparent text-foreground border border-border hover:bg-secondary',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          className,
        )}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {isLoading ? 'Загрузка...' : children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
