import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface SimStatus {
  fakeUsers: number;
  fakePredictions: number;
  scheduledMatches: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  totalPoints: number;
  predictionsCount: number;
}

export function AdminSimulationPage() {
  const [status, setStatus] = useState<SimStatus | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userCount, setUserCount] = useState(10);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const r = await adminService.getSimulationStatus();
      setStatus(r.data as SimStatus);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const run = async (label: string, fn: () => Promise<{ data: { message?: string } }>) => {
    setLoading(label);
    setMessage(null);
    try {
      const r = await fn();
      setMessage({ type: 'success', text: (r.data as any).message || 'Listo' });
      await loadStatus();
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Error inesperado' });
    } finally {
      setLoading(null);
    }
  };

  const handleLoadLeaderboard = async () => {
    setLoading('leaderboard');
    setMessage(null);
    try {
      const r = await adminService.getSimulationLeaderboard();
      setLeaderboard((r.data as any).leaderboard);
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Error al cargar ranking' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Usuarios ficticios', value: status?.fakeUsers ?? '—', icon: '🤖' },
          { label: 'Predicciones ficticias', value: status?.fakePredictions ?? '—', icon: '🎯' },
          { label: 'Partidos disponibles', value: status?.scheduledMatches ?? '—', icon: '⚽' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 text-center">
            <div className="text-2xl">{icon}</div>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {message && (
        <div className={`rounded-xl p-3 text-sm text-center font-medium ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-5">
        <h2 className="font-semibold text-gray-900">Pasos del simulacro</h2>

        {/* Step 1 */}
        <div className="flex items-center gap-4">
          <Badge variant="blue">1</Badge>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Generar usuarios ficticios</p>
            <p className="text-xs text-gray-500">Crea cuentas de prueba registradas en la base de datos</p>
          </div>
          <input
            type="number"
            min={1}
            max={50}
            value={userCount}
            onChange={(e) => setUserCount(Number(e.target.value))}
            className="w-16 text-center border border-gray-300 rounded-lg py-1 text-sm"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => run('users', () => adminService.generateSimulationUsers(userCount))}
            disabled={!!loading}
          >
            {loading === 'users' ? 'Creando…' : 'Generar'}
          </Button>
        </div>

        {/* Step 2 */}
        <div className="flex items-center gap-4">
          <Badge variant="blue">2</Badge>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Generar predicciones aleatorias</p>
            <p className="text-xs text-gray-500">Asigna predicciones al azar a todos los usuarios ficticios para cada partido</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => run('predictions', () => adminService.generateSimulationPredictions())}
            disabled={!!loading || (status?.fakeUsers ?? 0) === 0}
          >
            {loading === 'predictions' ? 'Generando…' : 'Generar'}
          </Button>
        </div>

        {/* Step 3 */}
        <div className="flex items-center gap-4">
          <Badge variant="green">3</Badge>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Ver ranking simulado</p>
            <p className="text-xs text-gray-500">Muestra el leaderboard con puntos estimados por participante</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadLeaderboard}
            disabled={!!loading || (status?.fakeUsers ?? 0) === 0}
          >
            {loading === 'leaderboard' ? 'Cargando…' : 'Ver ranking'}
          </Button>
        </div>

        {/* Step 4 */}
        <div className="flex items-center gap-4">
          <Badge variant="red">4</Badge>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Limpiar datos de simulación</p>
            <p className="text-xs text-gray-500 text-red-600">Elimina todos los usuarios y predicciones ficticias</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (!confirm('¿Eliminar todos los datos de simulación?')) return;
              run('clear', () => adminService.clearSimulationData());
              setLeaderboard([]);
            }}
            disabled={!!loading || (status?.fakeUsers ?? 0) === 0}
          >
            {loading === 'clear' ? 'Limpiando…' : 'Limpiar'}
          </Button>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">🏆 Ranking simulado</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Participante</th>
                  <th className="pb-2 pr-4 text-right">Predicciones</th>
                  <th className="pb-2 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-bold text-gray-500">
                      {entry.rank <= 3
                        ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                        : entry.rank}
                    </td>
                    <td className="py-2 pr-4">
                      <p className="font-medium text-gray-900">{entry.name}</p>
                      <p className="text-xs text-gray-400">{entry.email}</p>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-600">{entry.predictionsCount}</td>
                    <td className="py-2 text-right font-bold text-green-700">{entry.totalPoints} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
