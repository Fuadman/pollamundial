import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchMatches, setFilters } from '../features/matches/matchesSlice';
import {
  fetchUserPredictions,
  submitPrediction,
  updatePrediction,
} from '../features/predictions/predictionsSlice';
import { addNotification } from '../features/ui/uiSlice';
import { MatchCard } from '../components/shared/MatchCard';
import type {
  EliminationRound,
  Match,
  MatchPhase,
  MatchStatus,
  SubmitPredictionDto,
} from '../types';

type StageTab = {
  id: 'GROUP' | EliminationRound;
  label: string;
  phase: MatchPhase;
  eliminationRound?: EliminationRound;
};

const STAGE_TABS: StageTab[] = [
  { id: 'GROUP', label: 'Fase de Grupos', phase: 'group' },
  {
    id: 'R32',
    label: 'Dieciseisavos de final',
    phase: 'elimination',
    eliminationRound: 'R32',
  },
  {
    id: 'R16',
    label: 'Octavos de final',
    phase: 'elimination',
    eliminationRound: 'R16',
  },
  {
    id: 'QF',
    label: 'Cuartos de final',
    phase: 'elimination',
    eliminationRound: 'QF',
  },
  {
    id: 'SF',
    label: 'Semifinales',
    phase: 'elimination',
    eliminationRound: 'SF',
  },
  {
    id: 'THIRD',
    label: 'Partido por el tercer puesto',
    phase: 'elimination',
    eliminationRound: 'THIRD',
  },
  { id: 'FINAL', label: 'Final', phase: 'elimination', eliminationRound: 'FINAL' },
];

export function MatchesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: matches, loading } = useAppSelector((s) => s.matches);
  const predictions = useAppSelector((s) => s.predictions.items);
  const user = useAppSelector((s) => s.auth.user);

  const [selectedTab, setSelectedTab] = useState<StageTab['id']>('GROUP');
  const [group, setGroup] = useState<string>('');
  const [status, setStatus] = useState<MatchStatus | ''>('');
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);

  const activeTab =
    STAGE_TABS.find((tab) => tab.id === selectedTab) ?? STAGE_TABS[0];

  const getMatchTimestamp = (match: Match): number => {
    const localTime = new Date(match.scheduledTime.localTime).getTime();
    if (!Number.isNaN(localTime)) {
      return localTime;
    }

    const utcTime = new Date(match.scheduledTime.utcTime).getTime();
    if (!Number.isNaN(utcTime)) {
      return utcTime;
    }

    return 0;
  };

  const availableGroups = useMemo(() => {
    const groups = Array.from(
      new Set(
        matches
          .filter((match) => match.phase === 'group' && !!match.groupStageGroup)
          .map((match) => match.groupStageGroup as string),
      ),
    );
    return groups.sort((a, b) => a.localeCompare(b));
  }, [matches]);

  const groupedStageMatches = useMemo(() => {
    const grouped = new Map<string, Match[]>();

    for (const match of matches) {
      if (match.phase !== 'group' || !match.groupStageGroup) {
        continue;
      }
      if (!grouped.has(match.groupStageGroup)) {
        grouped.set(match.groupStageGroup, []);
      }
      grouped.get(match.groupStageGroup)!.push(match);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupKey, groupMatches]) => ({
        group: groupKey,
        matches: [...groupMatches].sort(
          (a, b) => getMatchTimestamp(a) - getMatchTimestamp(b),
        ),
      }));
  }, [matches]);

  const filteredEliminationMatches = useMemo(() => {
    return matches
      .filter((match) => {
        if (match.phase !== 'elimination') {
          return false;
        }
        if (!activeTab.eliminationRound) {
          return true;
        }
        return match.eliminationRound === activeTab.eliminationRound;
      })
      .sort((a, b) => getMatchTimestamp(a) - getMatchTimestamp(b));
  }, [matches, activeTab.eliminationRound]);

  useEffect(() => {
    const f: Parameters<typeof fetchMatches>[0] = {};
    f.phase = activeTab.phase;
    if (activeTab.eliminationRound) {
      f.eliminationRound = activeTab.eliminationRound;
    }
    if (activeTab.phase === 'group' && group) {
      f.group = group;
    }
    if (status) f.status = status;

    dispatch(fetchMatches(f));
    dispatch(
      setFilters({
        phase: activeTab.phase,
        eliminationRound: activeTab.eliminationRound,
        group: activeTab.phase === 'group' ? group : undefined,
        status: status || undefined,
      }),
    );
  }, [dispatch, activeTab.phase, activeTab.eliminationRound, group, status]);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserPredictions(user.id));
    }
  }, [dispatch, user]);

  const getPrediction = (matchId: string) => predictions.find((pr) => pr.matchId === matchId) ?? null;

  const handleInlinePredictionSave = async (
    match: Match,
    team1Score: number,
    team2Score: number,
  ) => {
    if (!user || match.result || match.predictionsBlocked) {
      return;
    }

    const existingPrediction = getPrediction(match.id);
    const derivedWinner =
      team1Score > team2Score
        ? match.team1.id
        : team2Score > team1Score
          ? match.team2.id
          : null;

    const data: SubmitPredictionDto = {
      matchId: match.id,
      predictedTeam1Score: team1Score,
      predictedTeam2Score: team2Score,
      predictedWinnerId: derivedWinner,
      predictedDraw: team1Score === team2Score,
    };

    setSubmittingMatchId(match.id);
    try {
      const result = existingPrediction
        ? await dispatch(
            updatePrediction({ predictionId: existingPrediction.id, data }),
          )
        : await dispatch(submitPrediction(data));

      if (submitPrediction.fulfilled.match(result) || updatePrediction.fulfilled.match(result)) {
        dispatch(addNotification({ type: 'success', message: 'Pronostico guardado' }));
        dispatch(fetchUserPredictions(user.id));
      } else {
        dispatch(addNotification({ type: 'error', message: 'No se pudo guardar el pronostico' }));
      }
    } finally {
      setSubmittingMatchId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partidos</h1>
        <p className="text-gray-500 text-sm">Copa Mundial 2026 — 104 partidos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Stage tabs */}
        <div className="flex flex-wrap rounded-lg border border-gray-200 bg-white overflow-hidden text-sm">
          {STAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTab(tab.id);
                if (tab.phase !== 'group') {
                  setGroup('');
                }
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Group filter (only in group phase) */}
        {activeTab.phase === 'group' && (
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los grupos</option>
            {availableGroups.map((g) => (
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
        <div className="space-y-6">
          {activeTab.phase === 'group' &&
            groupedStageMatches.map((groupBlock) => (
              <section key={groupBlock.group} className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h2 className="text-lg font-semibold text-gray-900">Grupo {groupBlock.group}</h2>
                  <span className="text-xs text-gray-500">{groupBlock.matches.length} partidos</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupBlock.matches.map((match) => {
                    const prediction = getPrediction(match.id);
                    return (
                      <MatchCard
                        key={match.id}
                        match={match}
                        canPredict={!!user?.registrationCompleted}
                        submittingPrediction={submittingMatchId === match.id}
                        onSavePrediction={(team1Score, team2Score) =>
                          handleInlinePredictionSave(match, team1Score, team2Score)
                        }
                        userPrediction={
                          prediction
                            ? {
                                predictionId: prediction.id,
                                team1Score: prediction.predictedTeam1Score,
                                team2Score: prediction.predictedTeam2Score,
                                pointsEarned: prediction.pointsEarned,
                              }
                            : null
                        }
                        onClick={() => navigate(`/matches/${match.id}`)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}

          {activeTab.phase === 'elimination' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h2 className="text-lg font-semibold text-gray-900">{activeTab.label}</h2>
                <span className="text-xs text-gray-500">{filteredEliminationMatches.length} partidos</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEliminationMatches.map((match) => {
                  const prediction = getPrediction(match.id);
                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      canPredict={!!user?.registrationCompleted}
                      submittingPrediction={submittingMatchId === match.id}
                      onSavePrediction={(team1Score, team2Score) =>
                        handleInlinePredictionSave(match, team1Score, team2Score)
                      }
                      userPrediction={
                        prediction
                          ? {
                              predictionId: prediction.id,
                              team1Score: prediction.predictedTeam1Score,
                              team2Score: prediction.predictedTeam2Score,
                              pointsEarned: prediction.pointsEarned,
                            }
                          : null
                      }
                      onClick={() => navigate(`/matches/${match.id}`)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
