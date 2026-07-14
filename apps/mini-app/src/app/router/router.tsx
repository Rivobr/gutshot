import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../providers/layout';
import { HomePage } from '../../pages/Home/HomePage';
import { TournamentsPage } from '../../pages/Tournaments/TournamentsPage';
import { TournamentPage } from '../../pages/Tournament/TournamentPage';
import { MyTournamentPage } from '../../pages/MyTournament/MyTournamentPage';
import { RatingPage } from '../../pages/Rating/RatingPage';
import { ProfilePage } from '../../pages/Profile/ProfilePage';
import { NotFoundPage } from '../../pages/NotFound/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tournaments', element: <TournamentsPage /> },
      { path: '/tournaments/:id', element: <TournamentPage /> },
      { path: '/my-tournament', element: <MyTournamentPage /> },
      { path: '/rating', element: <RatingPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
