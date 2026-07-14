import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../providers/layout';
import { ProtectedRoute } from '../providers/protected-route';
import { LoginPage } from '../../pages/Login/LoginPage';
import { DashboardPage } from '../../pages/Dashboard/DashboardPage';
import { PlayersPage } from '../../pages/Players/PlayersPage';
import { TournamentsPage } from '../../pages/Tournaments/TournamentsPage';
import { CheckInPage } from '../../pages/CheckIn/CheckInPage';
import { StatisticsPage } from '../../pages/Statistics/StatisticsPage';
import { SettingsPage } from '../../pages/Settings/SettingsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/tournaments', element: <TournamentsPage /> },
          { path: '/players', element: <PlayersPage /> },
          { path: '/check-in', element: <CheckInPage /> },
          { path: '/statistics', element: <StatisticsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
