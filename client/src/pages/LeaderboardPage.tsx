import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchLeaderboard, setPhase, setPage } from '../features/leaderboard/leaderboardSlice';
import type { LeaderboardPhase } from '../types';
import type { GroupStandings } from '../types';
import { matchService } from '../services/match.service';

const phaseLabels: Record<LeaderboardPhase, string> = {
  all: 'Todo',
  group: 'Fase de Grupos',
  elimination: 'Eliminación',
};

export function LeaderboardPage() {
  const dispatch = useAppDispatch();
  const { entries, total, page, phase, loading } = useAppSelector((s) => s.leaderboard);
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const [view, setView] = useState<'participants' | 'teams'>('participants');
  const [selectedGroup, setSelectedGroup] = useState<'all' | string>('all');
  const [groupStandings, setGroupStandings] = useState<GroupStandings[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 50;
  const totalPages = Math.ceil(total / limit);
  const groups = useMemo(
    () => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
    [],
  );

  const loadStandings = async (group: 'all' | string) => {
    setStandingsLoading(true);
    setStandingsError(null);
    try {
      const response = await matchService.getGroupStandings(
        group === 'all' ? undefined : group,
      );
      setGroupStandings(response.data.data);
    } catch {
      setStandingsError('No se pudo cargar la tabla de grupos');
    } finally {
      setStandingsLoading(false);
    }
  };

  const refreshCurrentView = async () => {
    setRefreshing(true);
    try {
      if (view === 'participants') {
        await dispatch(fetchLeaderboard({ phase, page })).unwrap();
      } else {
        await loadStandings(selectedGroup);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    dispatch(fetchLeaderboard({ phase, page }));
  }, [dispatch, phase, page]);

  useEffect(() => {
    if (view !== 'teams') {
      return;
    }

    loadStandings(selectedGroup);
  }, [view, selectedGroup]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (view === 'participants') {
        dispatch(fetchLeaderboard({ phase, page }));
      } else {
        void loadStandings(selectedGroup);
      }
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [dispatch, view, phase, page, selectedGroup]);

  useEffect(() => {
    const onFocus = () => {
      if (view === 'participants') {
        dispatch(fetchLeaderboard({ phase, page }));
      } else {
        void loadStandings(selectedGroup);
      }
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [dispatch, view, phase, page, selectedGroup]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tabla de Posiciones</h1>
        <p className="text-gray-500 text-sm">Copa Mundial 2026 — participantes y tabla de grupos</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            void refreshCurrentView();
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={refreshing || loading || standingsLoading}
        >
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="flex gap-2 rounded-lg border border-gray-200 bg-white w-fit overflow-hidden text-sm">
        <button
          onClick={() => setView('participants')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'participants' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Ranking de participantes
        </button>
        <button
          onClick={() => setView('teams')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'teams' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Tabla de grupos
        </button>
      </div>

      {view === 'participants' && (
        <>
          {/* Phase filter */}
          <div className="flex gap-2 rounded-lg border border-gray-200 bg-white w-fit overflow-hidden text-sm">
            {(Object.keys(phaseLabels) as LeaderboardPhase[]).map((p) => (
              <button
                key={p}
                onClick={() => dispatch(setPhase(p))}
                className={`px-4 py-2 font-medium transition-colors ${
                  phase === p ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {phaseLabels[p]}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">Cargando...</div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-center">#</th>
                    <th className="px-4 py-3 text-left">Participante</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">Grupos</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">Eliminación</th>
                    <th className="px-4 py-3 text-center font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => {
                    const isMe = entry.userId === currentUserId;
                    return (
                      <tr
                        key={entry.userId}
                        className={`transition-colors ${isMe ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 text-center">
                          {entry.rank <= 3 ? (
                            <span className="text-lg">
                              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="text-gray-500 font-medium">{entry.rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className={`font-medium ${isMe ? 'text-green-700' : 'text-gray-900'}`}>
                                {entry.name}
                                {isMe && <span className="ml-1.5 text-xs text-green-500">(tú)</span>}
                              </p>
                              <p className="text-xs text-gray-400">{entry.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-600">
                          {entry.groupStagePoints}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-600">
                          {entry.eliminationPoints}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg font-extrabold ${isMe ? 'text-green-700' : 'text-gray-900'}`}>
                            {entry.totalPoints}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={() => dispatch(setPage(page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => dispatch(setPage(page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {view === 'teams' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-2 w-fit">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                selectedGroup === 'all' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todos
            </button>
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  selectedGroup === group ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Grupo {group}
              </button>
            ))}
          </div>

          {standingsLoading ? (
            <div className="flex justify-center py-12 text-gray-400">Cargando tabla de grupos...</div>
          ) : standingsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {standingsError}
            </div>
          ) : groupStandings.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-sm text-gray-500 text-center">
              No hay datos de posiciones disponibles.
            </div>
          ) : (
            groupStandings.map((groupTable) => (
              <div key={groupTable.group} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Grupo {groupTable.group}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <th className="px-3 py-2 text-center">Pos</th>
                        <th className="px-3 py-2 text-left">Equipo</th>
                        <th className="px-3 py-2 text-center">PJ</th>
                        <th className="px-3 py-2 text-center">PG</th>
                        <th className="px-3 py-2 text-center">PE</th>
                        <th className="px-3 py-2 text-center">PP</th>
                        <th className="px-3 py-2 text-center">GF</th>
                        <th className="px-3 py-2 text-center">GC</th>
                        <th className="px-3 py-2 text-center">DG</th>
                        <th className="px-3 py-2 text-center font-bold">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupTable.standings.map((row) => (
                        <tr key={row.teamId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-center font-semibold text-gray-700">{row.position}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{row.team}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.played}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.won}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.drawn}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.lost}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.goalsFor}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.goalsAgainst}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.goalDifference}</td>
                          <td className="px-3 py-2 text-center font-bold text-gray-900">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
