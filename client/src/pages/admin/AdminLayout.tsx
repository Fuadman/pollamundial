import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { adminService } from '../../services/admin.service';

const adminNav = [
  { to: '/admin', label: '📊 Dashboard', exact: true },
  { to: '/admin/results', label: '⚽ Resultados' },
  { to: '/admin/news', label: '📰 Noticias' },
  { to: '/admin/bracket', label: '🏆 Bracket' },
  { to: '/admin/users', label: '👥 Usuarios' },
  { to: '/admin/simulation', label: '🤖 Simulacro' },
];

export function AdminLayout() {
  const location = useLocation();
  const [stats, setStats] = useState<{ totalUsers: number; totalPredictions: number; completedMatches: number } | null>(null);

  useEffect(() => {
    adminService.getStats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 text-sm">Polla Mundial 2026</p>
        </div>
        {stats && (
          <div className="hidden sm:flex gap-4 text-sm text-gray-500">
            <span><strong className="text-gray-900">{stats.totalUsers}</strong> usuarios</span>
            <span><strong className="text-gray-900">{stats.totalPredictions}</strong> predicciones</span>
            <span><strong className="text-gray-900">{stats.completedMatches}</strong> partidos</span>
          </div>
        )}
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {adminNav.map(({ to, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/admin';
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
