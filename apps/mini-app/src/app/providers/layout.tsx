import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BottomNavigation } from '../../widgets/BottomNavigation/BottomNavigation';
import { PageTransition } from './page-transition';

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
            background: 'radial-gradient(ellipse at 50% 0%, rgba(156,106,31,0.06) 0%, transparent 60%)',
          }}
        />
        <div className="flex-1 relative text-foreground hs overflow-y-auto" style={{ zIndex: 1, paddingBottom: 80 }}>
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
