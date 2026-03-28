import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { useAppDispatch } from '../../app/hooks';
import { addNotification } from '../../features/ui/uiSlice';
import { formatMatchTime } from '../../utils/timezone';
import type { Match } from '../../types';

export function AdminResultsPage() {
  const dispatch = useAppDispatch();
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ matchId: string; team1Score: number; team2Score: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPending = async () => {
    setLoading(true);
    try {
      const r = await adminService.getPendingResults();
      setPendingMatches(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const handlePublish = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await adminService.publishResult(form.matchId, {
        team1Score: form.team1Score,
        team2Score: form.team2Score,
      });
      dispatch(addNotification({ type: 'success', message: '✅ Resultado publicado y puntajes actualizados' }));
      setForm(null);
      loadPending();
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Error al publicar resultado' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Partidos pendientes de resultado</h2>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : pendingMatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
          No hay partidos pendientes de resultado
        </div>
      ) : (
        <div className="space-y-3">
          {pendingMatches.map((match) => (
            <div key={match.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {match.team1.name} vs {match.team2.name}
                  </p>
                  <p className="text-xs text-gray-400">{formatMatchTime(match.scheduledTime)}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    setForm({ matchId: match.id, team1Score: 0, team2Score: 0 })
                  }
                >
                  Ingresar resultado
                </Button>
              </div>

              {/* Inline result form */}
              {form?.matchId === match.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs font-medium text-gray-600">{match.team1.name}</p>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={form.team1Score}
                        onChange={(e) => setForm({ ...form, team1Score: Number(e.target.value) })}
                        className="w-16 text-center text-2xl font-bold rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none py-2"
                      />
                    </div>
                    <span className="text-2xl font-bold text-gray-300">–</span>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs font-medium text-gray-600">{match.team2.name}</p>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={form.team2Score}
                        onChange={(e) => setForm({ ...form, team2Score: Number(e.target.value) })}
                        className="w-16 text-center text-2xl font-bold rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none py-2"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setForm(null)}>
                      Cancelar
                    </Button>
                    <Button size="sm" loading={saving} onClick={handlePublish}>
                      Publicar resultado
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
