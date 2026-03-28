import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { useAppDispatch } from '../../app/hooks';
import { addNotification } from '../../features/ui/uiSlice';
import { formatMatchTime } from '../../utils/timezone';

interface PendingMatch {
  id: string;
  team1Name: string;
  team2Name: string;
  scheduledTime: string;
  status: string;
  predictionsBlocked: boolean;
}

interface RawPendingMatch {
  id?: string;
  matchId?: string;
  team1?: { name?: string };
  team2?: { name?: string };
  scheduledTime?: string;
  status?: string;
  predictionsBlocked?: boolean;
}

const statusLabel: Record<string, string> = {
  scheduled: 'Programado',
  in_progress: 'En juego',
  completed: 'Resultado pendiente',
  postponed: 'Postergado',
};

const normalizePendingMatch = (raw: RawPendingMatch): PendingMatch | null => {
  const id = raw.id ?? raw.matchId;
  if (!id) {
    return null;
  }

  return {
    id,
    team1Name: raw.team1?.name ?? 'Equipo 1',
    team2Name: raw.team2?.name ?? 'Equipo 2',
    scheduledTime: raw.scheduledTime ?? new Date().toISOString(),
    status: raw.status ?? 'completed',
    predictionsBlocked: raw.predictionsBlocked ?? false,
  };
};

export function AdminResultsPage() {
  const dispatch = useAppDispatch();
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ matchId: string; team1Score: number; team2Score: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [blockingMatchId, setBlockingMatchId] = useState<string | null>(null);
  const [unblockingMatchId, setUnblockingMatchId] = useState<string | null>(null);

  const isTogglingMatch = (matchId: string) =>
    blockingMatchId === matchId || unblockingMatchId === matchId;

  const loadPending = async () => {
    setLoading(true);
    try {
      const r = await adminService.getPendingResults();
      const payload = Array.isArray(r.data)
        ? r.data
        : Array.isArray((r.data as any)?.matches)
          ? (r.data as any).matches
          : [];

      const normalized = (payload as RawPendingMatch[])
        .map(normalizePendingMatch)
        .filter((m): m is PendingMatch => m !== null);

      setPendingMatches(normalized);
    } catch {
      setPendingMatches([]);
      dispatch(addNotification({ type: 'error', message: 'No se pudieron cargar los partidos pendientes' }));
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

  const handleBlockPredictions = async (matchId: string) => {
    setBlockingMatchId(matchId);
    try {
      const response = await adminService.blockPredictions(matchId);
      dispatch(
        addNotification({
          type: 'success',
          message: response.data.message || 'Predicciones bloqueadas',
        }),
      );
      await loadPending();
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Error al bloquear predicciones' }));
    } finally {
      setBlockingMatchId(null);
    }
  };

  const handleUnblockPredictions = async (matchId: string) => {
    setUnblockingMatchId(matchId);
    try {
      const response = await adminService.unblockPredictions(matchId);
      dispatch(
        addNotification({
          type: 'success',
          message: response.data.message || 'Predicciones desbloqueadas',
        }),
      );
      await loadPending();
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Error al desbloquear predicciones' }));
    } finally {
      setUnblockingMatchId(null);
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
                    {match.team1Name} vs {match.team2Name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400">{formatMatchTime(match.scheduledTime)}</p>
                    <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[11px] font-medium">
                      {statusLabel[match.status] ?? match.status}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    setForm({ matchId: match.id, team1Score: 0, team2Score: 0 })
                  }
                >
                  Ingresar resultado
                </Button>
                <Button
                  size="sm"
                  variant={match.predictionsBlocked ? 'ghost' : 'danger'}
                  disabled={isTogglingMatch(match.id)}
                  onClick={() =>
                    match.predictionsBlocked
                      ? handleUnblockPredictions(match.id)
                      : handleBlockPredictions(match.id)
                  }
                >
                  {blockingMatchId === match.id
                    ? 'Bloqueando...'
                    : unblockingMatchId === match.id
                      ? 'Desbloqueando...'
                      : match.predictionsBlocked
                        ? 'Desbloquear predicciones'
                        : 'Bloquear predicciones'}
                </Button>
              </div>

              {/* Inline result form */}
              {form?.matchId === match.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs font-medium text-gray-600">{match.team1Name}</p>
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
                      <p className="text-xs font-medium text-gray-600">{match.team2Name}</p>
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
