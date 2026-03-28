import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  TrophyIcon,
  UserIcon,
  ShieldCheckIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', label: 'Inicio', Icon: HomeIcon },
  { to: '/matches', label: 'Partidos', Icon: CalendarIcon },
  { to: '/leaderboard', label: 'Posiciones', Icon: TrophyIcon },
  { to: '/profile', label: 'Perfil', Icon: UserIcon },
];

export function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const isSimulation = useAppSelector((s) => s.ui.isSimulationMode);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {isSimulation && (
        <div className="bg-orange-500 text-white text-center text-xs font-bold py-1 tracking-wide">
          ⚠ MODO DE SIMULACIÓN — DATOS DE PRUEBA
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-gray-900 text-lg leading-tight">
              Polla<br />
              <span className="text-green-600">Mundial 2026</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  location.pathname.startsWith(to)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  location.pathname.startsWith('/admin')
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-purple-600 hover:bg-purple-50',
                )}
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* User section */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:block text-sm text-gray-600 max-w-[140px] truncate">
                {user.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
