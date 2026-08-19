import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BottomNavigation } from '../../widgets/BottomNavigation/BottomNavigation';
import { PageTransition } from './page-transition';

/**
 * Важно: отступ под «X Закрыть» — отдельный блок ВНЕ scroll-контейнера.
 * Если padding-top висит на overflow-y-auto, при скролле он уезжает вверх
 * и контент заезжает под кнопку Telegram.
 */
export function Layout(): JSX.Element {
  return (
    <div className="flex justify-center min-h-screen" style={{ background: '#000' }}>
      <div
        className="relative flex flex-col"
        style={{ width: '100%', maxWidth: 430, minHeight: '100dvh', background: '#090909' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(156,106,31,0.06) 0%, transparent 60%)',
          }}
        />

        {/* Нескроллируемый зазор под статус-бар + «Закрыть». */}
        <div
          aria-hidden
          className="shrink-0"
          style={{
            height: 'var(--app-top-pad, 96px)',
            background: '#090909',
            position: 'relative',
            zIndex: 2,
          }}
        />

        <div
          className="flex-1 relative text-foreground hs overflow-y-auto"
          style={{
            zIndex: 1,
            paddingBottom: 80,
            minHeight: 0,
          }}
        >
          <AnimatePresence mode="wait">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
        <BottomNavigation />
      </div>
    </div>
  );
}
