import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';

/**
 * Requires authenticated user. Redirects to /login if not authenticated.
 */
export function RequireAuth() {
  const token = useAppSelector((s) => s.auth.token);
  const loading = useAppSelector((s) => s.auth.loading);
  const location = useLocation();

  if (loading) return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

/**
 * Requires completed registration + payment. Redirects to /register or /payment.
 */
export function RequireRegistration() {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.registrationCompleted) return <Navigate to="/register" replace />;
  return <Outlet />;
}

/**
 * Requires admin role.
 */
export function RequireAdmin() {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/**
 * Redirects to /dashboard if already authenticated.
 */
export function RedirectIfAuthenticated() {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);

  if (token && user?.registrationCompleted) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
