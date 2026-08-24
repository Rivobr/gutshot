import { Link } from 'react-router-dom';
import { Logo } from '@/shared/ui/Logo';

export function NotFoundPage() {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="glow-bg" />
      <div className="center stack-16">
        <Logo />
        <h1 className="serif" style={{ fontSize: 28 }}>
          Страница не найдена
        </h1>
        <p className="muted">Такой страницы нет — но клуб на месте.</p>
        <Link className="btn btn-gold" to="/">
          На главную
        </Link>
      </div>
    </main>
  );
}
