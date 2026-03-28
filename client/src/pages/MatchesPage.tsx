import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchMatches, setFilters } from '../features/matches/matchesSlice';
import { fetchUserPredictions } from '../features/predictions/predictionsSlice';
import { MatchCard } from '../components/shared/MatchCard';
import type { MatchPhase, MatchStatus } from '../types';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function MatchesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: matches, loading } = useAppSelector((s) => s.matches);
  const predictions = useAppSelector((s) => s.predictions.items);
  const user = useAppSelector((s) => s.auth.user);

  const [phase, setPhase] = useState<MatchPhase | 'all'>('all');
  const [group, setGroup] = useState<string>('');
  const [status, setStatus] = useState<MatchStatus | ''>('');

  useEffect(() => {
    const f: Parameters<typeof fetchMatches>[0] = {};
    if (phase !== 'all') f.phase = phase;
    if (group) f.group = group;
    if (status) f.status = status;
    dispatch(fetchMatches(f));
    dispatch(setFilters({ phase: phase === 'all' ? undefined : phase, group, status: status || undefined }));
  }, [dispatch, phase, group, status]);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserPredictions(user.id));
    }
  }, [dispatch, user]);

  const getPrediction = (matchId: string) => {
    const p = predictions.find((pr) => pr.matchId === matchId);
    return p
      ? {
          team1Score: p.predictedTeam1Score,
          team2Score: p.predictedTeam2Score,
          pointsEarned: p.pointsEarned,
        }
      : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partidos</h1>
        <p className="text-gray-500 text-sm">Copa Mundial 2026 — 104 partidos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Phase tabs */}
        <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm">
          {(['all', 'group', 'elimination'] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPhase(p); setGroup(''); }}
              className={`px-4 py-2 font-medium transition-colors ${
                phase === p ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 'all' ? 'Todos' : p === 'group' ? 'Fase de Grupos' : 'Eliminación'}
            </button>
          ))}
        </div>

        {/* Group filter (only in group phase) */}
        {(phase === 'group' || phase === 'all') && (
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los grupos</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>Grupo {g}</option>
            ))}
          </select>
        )}

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MatchStatus | '')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos los estados</option>
          <option value="scheduled">Próximos</option>
          <option value="in_progress">En Vivo</option>
          <option value="completed">Finalizados</option>
        </select>
      </div>

      {/* Match list */}
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400">Cargando partidos...</div>
      ) : matches.length === 0 ? (
        <div className="flex justify-center py-12 text-gray-400">No hay partidos con estos filtros</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              userPrediction={getPrediction(match.id)}
              onClick={() => navigate(`/matches/${match.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
