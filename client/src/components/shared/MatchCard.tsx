import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import type { Match } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatShortDate, formatTime } from '../../utils/timezone';

const statusLabel: Record<string, { label: string; variant: 'green' | 'blue' | 'yellow' | 'gray' }> = {
  scheduled: { label: 'Próximo', variant: 'blue' },
  in_progress: { label: 'En Vivo', variant: 'green' },
  completed: { label: 'Finalizado', variant: 'gray' },
  postponed: { label: 'Postergado', variant: 'yellow' },
};

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  canPredict?: boolean;
  submittingPrediction?: boolean;
  onSavePrediction?: (team1Score: number, team2Score: number) => void;
  userPrediction?: {
    predictionId?: string;
    team1Score: number;
    team2Score: number;
    pointsEarned: number | null;
  } | null;
}

export function MatchCard({
  match,
  onClick,
  userPrediction,
  canPredict = false,
  submittingPrediction = false,
  onSavePrediction,
}: MatchCardProps) {
  const [team1Score, setTeam1Score] = useState<number>(userPrediction?.team1Score ?? 0);
  const [team2Score, setTeam2Score] = useState<number>(userPrediction?.team2Score ?? 0);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    setTeam1Score(userPrediction?.team1Score ?? 0);
    setTeam2Score(userPrediction?.team2Score ?? 0);
  }, [userPrediction?.team1Score, userPrediction?.team2Score, userPrediction?.predictionId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const baseStatus = statusLabel[match.status] ?? { label: match.status, variant: 'gray' };
  const displayStatus =
    match.status === 'completed' && !match.result
      ? { label: 'Finalizado', variant: 'gray' as const }
      : match.predictionsBlocked
        ? { label: 'Predicciones bloqueadas', variant: 'yellow' as const }
      : baseStatus;

  const showInlinePredictionForm =
    canPredict &&
    !match.result &&
    !match.predictionsBlocked &&
    typeof onSavePrediction === 'function';

  const handleInlineSubmit = () => {
    if (!onSavePrediction || !showInlinePredictionForm) {
      return;
    }
    onSavePrediction(team1Score, team2Score);
  };

  const matchResultText = match.result
    ? `${match.result.team1Score} – ${match.result.team2Score}`
    : match.status === 'completed'
      ? 'Resultado no publicado'
      : 'Pendiente';

  const userPredictionText = userPrediction
    ? `${userPrediction.team1Score} – ${userPrediction.team2Score}`
    : 'Sin predicción';

  const userPointsText = userPrediction
    ? userPrediction.pointsEarned !== null
      ? `${userPrediction.pointsEarned} pts`
      : 'Pendiente'
    : '0 pts';

  const lastUpdatedSource = match.result?.publishedTimestamp ?? match.updatedAt;

  const updatedAgoText = (() => {
    if (!lastUpdatedSource) {
      return null;
    }

    const updatedTime = new Date(lastUpdatedSource).getTime();
    if (Number.isNaN(updatedTime)) {
      return null;
    }

    const diffSeconds = Math.max(0, Math.floor((now - updatedTime) / 1000));
    if (diffSeconds < 10) {
      return 'Actualizado ahora';
    }
    if (diffSeconds < 60) {
      return `Actualizado hace ${diffSeconds}s`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `Actualizado hace ${diffMinutes}m`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `Actualizado hace ${diffHours}h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `Actualizado hace ${diffDays}d`;
  })();

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border bg-white p-4 shadow-sm transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {match.phase === 'group' && (
            <span className="font-medium">Grupo {match.groupStageGroup}</span>
          )}
          {match.phase === 'elimination' && match.eliminationRound && (
            <span className="font-medium">{match.eliminationRound}</span>
          )}
          <span>·</span>
          <span>{formatShortDate(match.scheduledTime)}</span>
          <span>{formatTime(match.scheduledTime)}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          {match.status === 'completed' && match.result && (
            <span className="text-xs font-semibold text-gray-700">
              {match.result.team1Score} – {match.result.team2Score}
            </span>
          )}
          <Badge variant={displayStatus.variant}>{displayStatus.label}</Badge>
        </div>
      </div>

      {/* Teams and score */}
      <div className="flex items-center justify-between gap-2">
        {/* Team 1 */}
        <div className="min-w-0 flex-1 text-right">
          <p className="font-semibold text-gray-900 truncate">{match.team1.name}</p>
          <p className="text-xs text-gray-400 uppercase">{match.team1.code}</p>
        </div>

        <div className="flex items-center gap-2 px-3">
          {match.result ? (
            <span className="text-xl font-bold text-gray-900">
              {match.result.team1Score} – {match.result.team2Score}
            </span>
          ) : (
            <span className="text-xl font-bold text-gray-300">vs</span>
          )}
        </div>

        {/* Team 2 */}
        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-gray-900 truncate">{match.team2.name}</p>
          <p className="text-xs text-gray-400 uppercase">{match.team2.code}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
        <div className="flex items-center justify-between">
          <span>Resultado del partido:</span>
          <span className="font-medium text-gray-700">{matchResultText}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Mi predicción:</span>
          <span className="font-medium text-gray-700">{userPredictionText}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Mi puntaje:</span>
          <span className="font-semibold text-green-700">{userPointsText}</span>
        </div>
        {updatedAgoText && (
          <div className="text-right text-[11px] text-gray-400">{updatedAgoText}</div>
        )}
      </div>

      {match.result?.decidedByPenalties && (
        <div className="mt-1 text-xs text-amber-700 text-right">
          Penales: {match.result.team1PenaltyScore ?? 0} - {match.result.team2PenaltyScore ?? 0}
        </div>
      )}

      {match.predictionsBlocked && !match.result && (
        <p className="mt-2 text-xs text-amber-700 text-center font-medium">
          Predicciones bloqueadas por el administrador
        </p>
      )}

      {!userPrediction && !match.result && !match.predictionsBlocked && (
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold border border-blue-200">
            + Añadir predicción
          </span>
        </div>
      )}

      {showInlinePredictionForm && (
        <div
          className="mt-3 pt-3 border-t border-gray-100"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-xs text-gray-500 mb-2">
            {userPrediction ? 'Editar pronostico' : 'Pronosticar ahora'}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={20}
              value={team1Score}
              onChange={(event) => setTeam1Score(Number(event.target.value))}
              className="w-14 rounded-md border border-gray-300 px-2 py-1 text-sm text-center"
            />
            <span className="text-sm text-gray-400">-</span>
            <input
              type="number"
              min={0}
              max={20}
              value={team2Score}
              onChange={(event) => setTeam2Score(Number(event.target.value))}
              className="w-14 rounded-md border border-gray-300 px-2 py-1 text-sm text-center"
            />
            <Button
              size="sm"
              onClick={handleInlineSubmit}
              loading={submittingPrediction}
              disabled={submittingPrediction}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
