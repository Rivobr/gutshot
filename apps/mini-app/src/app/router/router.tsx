import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../providers/layout';
import { HomePage } from '../../pages/Home/HomePage';
import { TournamentsPage } from '../../pages/Tournaments/TournamentsPage';
import { TournamentPage } from '../../pages/Tournament/TournamentPage';
import { RatingPage } from '../../pages/Rating/RatingPage';
import { ProfilePage } from '../../pages/Profile/ProfilePage';
import { AchievementsPage } from '../../pages/Achievements/AchievementsPage';
import { AboutPage } from '../../pages/About/AboutPage';
import { SupportPage } from '../../pages/Support/SupportPage';
import { FaqPage } from '../../pages/Faq/FaqPage';
import { DirectionsPage } from '../../pages/Directions/DirectionsPage';
import { RulesPage } from '../../pages/Rules/RulesPage';
import { NotFoundPage } from '../../pages/NotFound/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tournaments', element: <TournamentsPage /> },
      { path: '/tournaments/:id', element: <TournamentPage /> },
      { path: '/rating', element: <RatingPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/achievements', element: <AchievementsPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/directions', element: <DirectionsPage /> },
      { path: '/rules', element: <RulesPage /> },
      { path: '/support', element: <SupportPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
