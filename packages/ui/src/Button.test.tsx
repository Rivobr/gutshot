import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('рендерит переданный текст', () => {
    render(<Button>Нажми меня</Button>);
    expect(screen.getByText('Нажми меня')).toBeInTheDocument();
  });

  it('вызывает onClick при нажатии', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Клик</Button>);
    fireEvent.click(screen.getByText('Клик'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('блокирует нажатие в состоянии isLoading', () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Клик
      </Button>,
    );
    fireEvent.click(screen.getByText('Загрузка...'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
