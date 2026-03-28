import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchLeaderboard } from '../../features/leaderboard/leaderboardSlice';

export function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((s) => s.leaderboard.entries);

  useEffect(() => {
    dispatch(fetchLeaderboard({ phase: 'all', page: 1 }));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Total usuarios" icon="👥" />
        <AdminStatCard label="Predicciones totales" icon="🎯" />
        <AdminStatCard label="Partidos completados" icon="✅" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Top 10 participantes</h2>
        <div className="space-y-2">
          {entries.slice(0, 10).map((e) => (
            <div key={e.userId} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-5 text-center font-bold text-gray-400">{e.rank}</span>
                <div>
                  <p className="font-medium text-gray-900">{e.name}</p>
                  <p className="text-xs text-gray-400">{e.email}</p>
                </div>
              </div>
              <span className="font-bold text-green-700">{e.totalPoints} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900">—</p>
    </div>
  );
}
