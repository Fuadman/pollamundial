import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppBootstrap } from './components/layout/AppBootstrap';
import { RequireAuth, RequireRegistration, RequireAdmin, RedirectIfAuthenticated } from './components/layout/Guards';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { RegisterPage } from './pages/RegisterPage';
import { PaymentPage } from './pages/PaymentPage';
import { DashboardPage } from './pages/DashboardPage';
import { MatchesPage } from './pages/MatchesPage';
import { MatchDetailPage } from './pages/MatchDetailPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminResultsPage } from './pages/admin/AdminResultsPage';
import { AdminNewsPage } from './pages/admin/AdminNewsPage';
import { AdminBracketPage } from './pages/admin/AdminBracketPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSimulationPage } from './pages/admin/AdminSimulationPage';

export default function App() {
  return (
    <AppBootstrap>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/payment" element={<PaymentPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<RequireRegistration />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/matches/:id" element={<MatchDetailPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="results" element={<AdminResultsPage />} />
                  <Route path="news" element={<AdminNewsPage />} />
                  <Route path="bracket" element={<AdminBracketPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="simulation" element={<AdminSimulationPage />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppBootstrap>
  );
}
