import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppDispatch } from '../../app/hooks';
import { addNotification } from '../../features/ui/uiSlice';
import { adminService } from '../../services/admin.service';
import { matchService } from '../../services/match.service';
import type { Team } from '../../types';

type BracketRoundKey = 'round16' | 'quarterfinals' | 'semifinals';

interface RoundConfig {
  key: BracketRoundKey;
  label: string;
  description: string;
  requiredTeams: number;
}

const ROUND_CONFIGS: RoundConfig[] = [
  {
    key: 'round16',
    label: 'Octavos',
    description: 'Configura 8 cruces con 16 selecciones clasificadas.',
    requiredTeams: 16,
  },
  {
    key: 'quarterfinals',
    label: 'Cuartos',
    description: 'Configura 4 cruces con 8 selecciones clasificadas.',
    requiredTeams: 8,
  },
  {
    key: 'semifinals',
    label: 'Semifinales',
    description: 'Configura 2 semifinales y el partido por el tercer puesto.',
    requiredTeams: 4,
  },
];

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = error as { response?: { status?: number; data?: { message?: string | string[] } } };
    if (maybeResponse.response?.status === 404) {
      return 'El backend aun no expone este endpoint de configuracion.';
    }
    const message = maybeResponse.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'No se pudo configurar el bracket.';
}

export function AdminBracketPage() {
  const dispatch = useAppDispatch();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRound, setSelectedRound] = useState<BracketRoundKey>('round16');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const currentRound = ROUND_CONFIGS.find((round) => round.key === selectedRound) ?? ROUND_CONFIGS[0];

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const response = await matchService.getMatches();
        const uniqueTeams = new Map<string, Team>();

        for (const match of response.data) {
          uniqueTeams.set(match.team1.id, match.team1);
          uniqueTeams.set(match.team2.id, match.team2);
        }

        setTeams(Array.from(uniqueTeams.values()).sort((left, right) => left.name.localeCompare(right.name)));
      } catch {
        dispatch(addNotification({ type: 'error', message: 'No se pudieron cargar las selecciones.' }));
      } finally {
        setLoading(false);
      }
    };

    void loadTeams();
  }, [dispatch]);

  useEffect(() => {
    setSelectedTeamIds([]);
  }, [selectedRound]);

  const visibleTeams = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return teams;

    return teams.filter((team) =>
      `${team.name} ${team.code} ${team.groupStageGroup}`.toLowerCase().includes(normalizedSearch),
    );
  }, [search, teams]);

  const selectedTeams = useMemo(
    () => teams.filter((team) => selectedTeamIds.includes(team.id)),
    [selectedTeamIds, teams],
  );

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((current) => {
      if (current.includes(teamId)) {
        return current.filter((id) => id !== teamId);
      }

      if (current.length >= currentRound.requiredTeams) {
        dispatch(addNotification({
          type: 'warning',
          message: `Solo puedes seleccionar ${currentRound.requiredTeams} equipos en ${currentRound.label}.`,
        }));
        return current;
      }

      return [...current, teamId];
    });
  };

  const handleSubmit = async () => {
    if (selectedTeamIds.length !== currentRound.requiredTeams) {
      dispatch(addNotification({
        type: 'warning',
        message: `Debes seleccionar exactamente ${currentRound.requiredTeams} equipos.`,
      }));
      return;
    }

    setSaving(true);
    try {
      if (selectedRound === 'round16') {
        await adminService.configureRound16(selectedTeamIds);
      } else if (selectedRound === 'quarterfinals') {
        await adminService.configureQuarterfinals(selectedTeamIds);
      } else {
        await adminService.configureSemifinals(selectedTeamIds);
      }

      dispatch(addNotification({
        type: 'success',
        message: `Bracket de ${currentRound.label.toLowerCase()} configurado correctamente.`,
      }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', message: getErrorMessage(error) }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Configuracion de Bracket</h2>
        <p className="text-sm text-gray-500">
          Selecciona las selecciones clasificadas por ronda. La configuracion valida cantidad exacta antes de enviarse.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ROUND_CONFIGS.map((round) => {
          const active = round.key === selectedRound;
          return (
            <button
              key={round.key}
              type="button"
              onClick={() => setSelectedRound(round.key)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{round.label}</p>
              <p className="mt-1 text-xs text-gray-500">{round.description}</p>
              <p className="mt-3 text-xs font-medium text-purple-700">{round.requiredTeams} equipos</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{currentRound.label}</h3>
            <p className="text-sm text-gray-500">{currentRound.description}</p>
          </div>
          <div className="sm:w-72">
            <Input
              id="team-search"
              label="Buscar seleccion"
              placeholder="Nombre, codigo o grupo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
            {selectedTeamIds.length}/{currentRound.requiredTeams} seleccionados
          </span>
          {selectedTeams.map((team) => (
            <span key={team.id} className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
              {team.name}
            </span>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Cargando selecciones...</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTeams.map((team) => {
              const checked = selectedTeamIds.includes(team.id);
              return (
                <label
                  key={team.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                    checked ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{team.name}</p>
                    <p className="text-xs text-gray-500">{team.code} · Grupo {team.groupStageGroup}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTeam(team.id)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </label>
              );
            })}
          </div>
        )}

        {!loading && visibleTeams.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            No hay selecciones que coincidan con la busqueda.
          </div>
        )}

        <div className="flex justify-end">
          <Button loading={saving} onClick={handleSubmit} disabled={loading || selectedTeamIds.length !== currentRound.requiredTeams}>
            Guardar bracket
          </Button>
        </div>
      </div>
    </div>
  );
}