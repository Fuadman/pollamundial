import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchLeaderboard, setPhase, setPage } from '../features/leaderboard/leaderboardSlice';
import type { LeaderboardPhase } from '../types';

const phaseLabels: Record<LeaderboardPhase, string> = {
  all: 'Todo',
  group: 'Fase de Grupos',
  elimination: 'Eliminación',
};

export function LeaderboardPage() {
  const dispatch = useAppDispatch();
  const { entries, total, page, phase, loading } = useAppSelector((s) => s.leaderboard);
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    dispatch(fetchLeaderboard({ phase, page }));
  }, [dispatch, phase, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tabla de Posiciones</h1>
        <p className="text-gray-500 text-sm">Copa Mundial 2026 — ranking de participantes</p>
      </div>

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
    </div>
  );
}
