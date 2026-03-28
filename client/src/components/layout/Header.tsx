import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  HomeIcon,
  CalendarIcon,
  TrophyIcon,
  UserIcon,
  ShieldCheckIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchSession, logout, setToken } from '../../features/auth/authSlice';
import { clsx } from 'clsx';
import { adminService } from '../../services/admin.service';
import type { AdminUserListItem } from '../../services/admin.service';

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
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [switchQuery, setSwitchQuery] = useState('');
  const [switchUsers, setSwitchUsers] = useState<AdminUserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [switchingUserId, setSwitchingUserId] = useState<string | null>(null);
  const switchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!switchMenuRef.current) return;
      if (!switchMenuRef.current.contains(event.target as Node)) {
        setShowSwitchMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showSwitchMenu || user?.role !== 'admin') {
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const response = await adminService.listUsers(switchQuery, 30);
        setSwitchUsers(response.data.users);
      } catch {
        setSwitchUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [showSwitchMenu, switchQuery, user?.role]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleSwitchUser = async (targetUserId: string) => {
    if (!user || user.role !== 'admin') return;

    setSwitchingUserId(targetUserId);
    try {
      const response = await adminService.switchUser(targetUserId);
      dispatch(setToken(response.data.accessToken));
      await dispatch(fetchSession());
      setShowSwitchMenu(false);
      navigate('/dashboard');
    } finally {
      setSwitchingUserId(null);
    }
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
              <div className="relative" ref={switchMenuRef}>
                <button
                  type="button"
                  className="hidden sm:inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    if (user.role === 'admin') {
                      setShowSwitchMenu((prev) => !prev);
                    }
                  }}
                  disabled={user.role !== 'admin'}
                >
                  {user.name}
                </button>

                {showSwitchMenu && user.role === 'admin' && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg p-3 z-50">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Cambiar usuario (testing)</p>
                    <input
                      type="text"
                      value={switchQuery}
                      onChange={(e) => setSwitchQuery(e.target.value)}
                      placeholder="Buscar por nombre o email"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {loadingUsers ? (
                        <p className="py-3 text-sm text-gray-400 text-center">Cargando usuarios...</p>
                      ) : switchUsers.length === 0 ? (
                        <p className="py-3 text-sm text-gray-400 text-center">Sin resultados</p>
                      ) : (
                        switchUsers.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="w-full text-left py-2 px-1 hover:bg-gray-50 rounded-md"
                            onClick={() => handleSwitchUser(item.id)}
                            disabled={switchingUserId !== null}
                          >
                            <p className="text-sm font-medium text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-500 truncate">{item.email} · {item.role}</p>
                            {switchingUserId === item.id && (
                              <p className="text-xs text-green-600 mt-1">Cambiando...</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
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
