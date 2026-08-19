import { useNavigate } from 'react-router-dom';

/** Единая кнопка «Назад» для всех экранов Mini App. */
export function BackButton({ className = '' }: { className?: string }): JSX.Element {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`sans self-start inline-flex items-center gap-1 rounded-full ${className}`.trim()}
      style={{
        fontSize: 15,
        fontWeight: 600,
        color: '#C89A3D',
        background: 'rgba(199,154,61,0.1)',
        border: '1px solid rgba(199,154,61,0.28)',
        padding: '10px 16px',
        minHeight: 44,
        letterSpacing: '0.02em',
        cursor: 'pointer',
      }}
    >
      ‹ Назад
    </button>
  );
}
