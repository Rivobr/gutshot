import { Route, Routes } from 'react-router-dom';
import { LandingPage } from '@/pages/Landing/LandingPage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { RegisterPage } from '@/pages/Register/RegisterPage';
import { ForgotPage } from '@/pages/Forgot/ForgotPage';
import { ResetPage } from '@/pages/Reset/ResetPage';
import { InstallGuidePage } from '@/pages/Install/InstallGuidePage';
import { AppLayout } from '@/pages/app/AppLayout';
import { CabinetHomePage } from '@/pages/app/Home/HomePage';
import { RatingPage } from '@/pages/app/Rating/RatingPage';
import { ProfilePage } from '@/pages/app/Profile/ProfilePage';
import { QrPage } from '@/pages/app/Qr/QrPage';
import { TournamentDetailsPage } from '@/pages/app/Tournaments/TournamentDetailsPage';
import { NotFoundPage } from '@/pages/NotFound/NotFoundPage';
import { ProtectedRoute } from '@/app/providers/protected-route';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot" element={<ForgotPage />} />
      <Route path="/reset" element={<ResetPage />} />
      <Route path="/install" element={<InstallGuidePage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CabinetHomePage />} />
        <Route path="rating" element={<RatingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="qr" element={<QrPage />} />
        <Route path="tournaments/:id" element={<TournamentDetailsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
