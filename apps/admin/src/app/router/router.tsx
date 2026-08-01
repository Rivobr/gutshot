import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../providers/layout';
import { ProtectedRoute } from '../providers/protected-route';
import { LoginPage } from '../../pages/Login/LoginPage';
import { DashboardPage } from '../../pages/Dashboard/DashboardPage';
import { PlayersPage } from '../../pages/Players/PlayersPage';
import { TournamentsPage } from '../../pages/Tournaments/TournamentsPage';
import { TournamentDetailsPage } from '../../pages/Tournaments/TournamentDetailsPage';
import { ScannerPage } from '../../pages/Scanner/ScannerPage';
import { XpSettingsPage } from '../../pages/XpSettings/XpSettingsPage';
import { LegalDocumentsPage } from '../../pages/LegalDocuments/LegalDocumentsPage';
import { HistoryPage } from '../../pages/History/HistoryPage';
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
          { path: '/tournaments/:id', element: <TournamentDetailsPage /> },
          { path: '/players', element: <PlayersPage /> },
          { path: '/scanner', element: <ScannerPage /> },
          { path: '/history', element: <HistoryPage /> },
          { path: '/xp-settings', element: <XpSettingsPage /> },
          { path: '/legal-documents', element: <LegalDocumentsPage /> },
          { path: '/statistics', element: <StatisticsPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
