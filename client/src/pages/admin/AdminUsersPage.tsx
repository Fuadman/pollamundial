import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppDispatch } from '../../app/hooks';
import { addNotification } from '../../features/ui/uiSlice';
import { adminService } from '../../services/admin.service';
import { leaderboardService } from '../../services/leaderboard.service';
import { formatDate, formatShortDate, formatTime } from '../../utils/timezone';
import type { LeaderboardEntry, Prediction, UserRole } from '../../types';

function getRoleErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = error as { response?: { data?: { message?: string | string[] } } };
    const message = maybeResponse.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'No se pudo actualizar el rol del usuario.';
}

export function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<string, UserRole>>({});
  const [predictionsByUser, setPredictionsByUser] = useState<Record<string, Prediction[]>>({});
  const [roleLoading, setRoleLoading] = useState(false);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Enroll form state
  const [tab, setTab] = useState<'list' | 'enroll'>('list');
  const [enrollForm, setEnrollForm] = useState({ email: '', name: '' });
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const response = await leaderboardService.getLeaderboard('all', 1, 200);
        setEntries(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedUserId(response.data.data[0].userId);
        }
      } catch {
        dispatch(addNotification({ type: 'error', message: 'No se pudo cargar la lista de participantes.' }));
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedUserId) return;
    const loadRole = async () => {
      setRoleLoading(true);
      try {
        const response = await adminService.getUserRole(selectedUserId);
        setRoles((current) => ({ ...current, [selectedUserId]: response.data.role }));
      } catch {
        dispatch(addNotification({ type: 'error', message: 'No se pudo consultar el rol del usuario.' }));
      } finally {
        setRoleLoading(false);
      }
    };

    void loadRole();
  }, [dispatch, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    const loadPredictions = async () => {
      if (predictionsByUser[selectedUserId]) {
        return;
      }

      setPredictionsLoading(true);
      try {
        const response = await adminService.getUserPredictions(selectedUserId);
        setPredictionsByUser((current) => ({
          ...current,
          [selectedUserId]: response.data,
        }));
      } catch {
        dispatch(addNotification({ type: 'error', message: 'No se pudieron cargar las predicciones del usuario.' }));
      } finally {
        setPredictionsLoading(false);
      }
    };

    void loadPredictions();
  }, [dispatch, predictionsByUser, selectedUserId]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return entries;

    return entries.filter((entry) =>
      `${entry.name} ${entry.email}`.toLowerCase().includes(normalizedQuery),
    );
  }, [entries, query]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.userId === selectedUserId) ?? null,
    [entries, selectedUserId],
  );

  const selectedRole = selectedUserId ? roles[selectedUserId] : undefined;
  const selectedPredictions = selectedUserId ? predictionsByUser[selectedUserId] ?? [] : [];

  const handleRoleChange = async (nextRole: UserRole) => {
    if (!selectedEntry || !selectedRole || selectedRole === nextRole) return;

    setUpdatingRole(true);
    try {
      if (nextRole === 'admin') {
        await adminService.promoteUser(selectedEntry.userId);
      } else {
        await adminService.demoteUser(selectedEntry.userId);
      }

      setRoles((current) => ({ ...current, [selectedEntry.userId]: nextRole }));
      dispatch(addNotification({
        type: 'success',
        message: `${selectedEntry.name} ahora tiene rol ${nextRole}.`,
      }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', message: getRoleErrorMessage(error) }));
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleEnrollUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.email.trim() || !enrollForm.name.trim()) return;

    setEnrolling(true);
    try {
      await adminService.enrollUser({ email: enrollForm.email, name: enrollForm.name });
      dispatch(addNotification({
        type: 'success',
        message: `${enrollForm.name} fue inscrito correctamente.`,
      }));
      setEnrollForm({ email: '', name: '' });
      setTab('list');
      // Reload users list
      const response = await leaderboardService.getLeaderboard('all', 1, 200);
      setEntries(response.data.data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'No se pudo inscribir el usuario';
      dispatch(addNotification({ type: 'error', message: errorMsg }));
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setTab('list')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setTab('enroll')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'enroll' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Inscribir
          </button>
        </div>

        {tab === 'list' ? (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Usuarios</h2>
              <p className="text-sm text-gray-500">Busca participantes y selecciona uno para ver su estado administrativo.</p>
            </div>

            <Input
              id="user-search"
              label="Buscar participante"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre o correo"
            />

            {loading ? (
              <p className="text-sm text-gray-400">Cargando participantes...</p>
            ) : filteredEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
                No hay participantes para mostrar.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => {
                  const active = entry.userId === selectedUserId;
                  const role = roles[entry.userId];
                  return (
                    <button
                      key={entry.userId}
                      type="button"
                      onClick={() => setSelectedUserId(entry.userId)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                        active ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                          <p className="text-xs text-gray-500">{entry.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">#{entry.rank}</p>
                          <p className="text-xs text-gray-500">{entry.totalPoints} pts</p>
                          {role && (
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-purple-700">{role}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Inscribir participante</h2>
              <p className="text-sm text-gray-500">Agrega un nuevo participante al torneo. Podrá loguear con su correo Google.</p>
            </div>

            <form onSubmit={handleEnrollUser} className="space-y-4">
              <Input
                id="enroll-name"
                label="Nombre completo"
                value={enrollForm.name}
                onChange={(e) => setEnrollForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                required
              />
              <Input
                id="enroll-email"
                label="Correo (Google)"
                type="email"
                value={enrollForm.email}
                onChange={(e) => setEnrollForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="juan@gmail.com"
                required
              />
              <Button type="submit" className="w-full" loading={enrolling} disabled={enrolling}>
                {enrolling ? 'Inscribiendo...' : 'Inscribir participante'}
              </Button>
            </form>
          </>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {!selectedEntry ? (
          <div className="flex h-full min-h-72 items-center justify-center text-sm text-gray-400">
            Selecciona un participante para ver su detalle.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedEntry.name}</h2>
                <p className="text-sm text-gray-500">{selectedEntry.email}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500">Rol actual</p>
                <p className="text-base font-semibold text-purple-700">
                  {roleLoading ? 'Consultando...' : selectedRole ?? 'Sin dato'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Posicion" value={`#${selectedEntry.rank}`} />
              <MetricCard label="Puntos totales" value={String(selectedEntry.totalPoints)} />
              <MetricCard label="Puntos grupos" value={String(selectedEntry.groupStagePoints)} />
              <MetricCard label="Puntos eliminacion" value={String(selectedEntry.eliminationPoints)} />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
              <p><span className="font-medium text-gray-700">Registro:</span> <span className="text-gray-600">{formatDate(selectedEntry.registrationTimestamp)}</span></p>
              <p><span className="font-medium text-gray-700">Usuario ID:</span> <span className="text-gray-600">{selectedEntry.userId}</span></p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleRoleChange('admin')}
                loading={updatingRole}
                disabled={roleLoading || updatingRole || selectedRole === 'admin'}
              >
                Promover a admin
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleRoleChange('user')}
                loading={updatingRole}
                disabled={roleLoading || updatingRole || selectedRole === 'user'}
              >
                Dejar como usuario
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">Predicciones del usuario</h3>
              {predictionsLoading ? (
                <p className="text-sm text-gray-400">Cargando predicciones...</p>
              ) : selectedPredictions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-400">
                  Este usuario no tiene predicciones registradas.
                </div>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {selectedPredictions.map((prediction) => (
                    <div key={prediction.id} className="rounded-xl border border-gray-200 bg-white p-3">
                      <p className="text-sm font-medium text-gray-900">
                        {prediction.match?.team1.name ?? 'Equipo 1'} vs {prediction.match?.team2.name ?? 'Equipo 2'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {prediction.match ? `${formatShortDate(prediction.match.scheduledTime)} · ${formatTime(prediction.match.scheduledTime)}` : 'Partido sin detalle'}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-800">
                          Pronostico: {prediction.predictedTeam1Score} - {prediction.predictedTeam2Score}
                        </span>
                        <span className="text-gray-600">
                          {prediction.pointsEarned === null ? 'Pendiente' : `${prediction.pointsEarned} pts`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}