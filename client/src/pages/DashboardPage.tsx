import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchUserPredictions } from '../features/predictions/predictionsSlice';
import { fetchLeaderboard } from '../features/leaderboard/leaderboardSlice';
import { Badge } from '../components/ui/Badge';
import { formatShortDate, formatTime } from '../utils/timezone';
import type { Prediction } from '../types';

function statusBadge(p: Prediction) {
  if (p.match?.status === 'completed' && p.pointsEarned !== null)
    return <Badge variant="green">✅ {p.pointsEarned} pts</Badge>;
  if (p.lockedTimestamp) return <Badge variant="yellow">🔒 Bloqueada</Badge>;
  return <Badge variant="blue">⏳ Pendiente</Badge>;
}

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const predictions = useAppSelector((s) => s.predictions.items);
  const loading = useAppSelector((s) => s.predictions.loading);
  const leaderboard = useAppSelector((s) => s.leaderboard.entries);

  const userRank = leaderboard.find((e) => e.userId === user?.id);
  const totalPoints = userRank?.totalPoints ?? 0;
  const rank = userRank?.rank ?? '—';

  const pending = predictions.filter((p) => !p.lockedTimestamp && p.pointsEarned === null);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserPredictions(user.id));
      dispatch(fetchLeaderboard({ phase: 'all', page: 1 }));
    }
  }, [user, dispatch]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm">Copa Mundial 2026 — tu panel de predicciones</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Puntos totales" value={String(totalPoints)} color="text-green-600" />
        <StatCard label="Posición" value={`#${rank}`} color="text-blue-600" />
        <StatCard label="Predicciones" value={String(predictions.length)} color="text-gray-900" />
        <StatCard label="Pendientes" value={String(pending.length)} color="text-yellow-600" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/matches"
          className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          Ver partidos →
        </Link>
        <Link
          to="/leaderboard"
          className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-sm font-medium transition-colors"
        >
          Tabla de posiciones
        </Link>
      </div>

      {/* Predictions list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Mis predicciones</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Cargando...</p>
        ) : predictions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
            <p className="text-2xl mb-2">⚽</p>
            <p>Aún no tienes predicciones</p>
            <Link to="/matches" className="mt-2 inline-block text-sm text-green-600 hover:underline">
              Ver partidos disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {predictions.map((p) => (
              <Link
                key={p.id}
                to={`/matches/${p.matchId}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {p.match?.team1.name ?? '??'} vs {p.match?.team2.name ?? '??'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.match ? formatShortDate(p.match.scheduledTime) + ' · ' + formatTime(p.match.scheduledTime) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-700">
                    {p.predictedTeam1Score} – {p.predictedTeam2Score}
                  </span>
                  {statusBadge(p)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
