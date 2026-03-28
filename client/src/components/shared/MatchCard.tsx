import { clsx } from 'clsx';
import type { Match } from '../../types';
import { Badge } from '../ui/Badge';
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
  userPrediction?: {
    team1Score: number;
    team2Score: number;
    pointsEarned: number | null;
  } | null;
}

export function MatchCard({ match, onClick, userPrediction }: MatchCardProps) {
  const baseStatus = statusLabel[match.status] ?? { label: match.status, variant: 'gray' };
  const displayStatus =
    match.status === 'completed' && !match.result
      ? { label: 'Resultado pendiente', variant: 'yellow' as const }
      : match.predictionsBlocked
        ? { label: 'Predicciones bloqueadas', variant: 'yellow' as const }
      : baseStatus;

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
        <div className="flex-1 text-right">
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
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900 truncate">{match.team2.name}</p>
          <p className="text-xs text-gray-400 uppercase">{match.team2.code}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Resultado del partido:</span>
        <span className="font-medium text-gray-700">
          {match.result
            ? `${match.result.team1Score} – ${match.result.team2Score}`
            : match.status === 'completed'
              ? 'Resultado no publicado'
              : 'Pendiente'}
        </span>
      </div>

      {match.predictionsBlocked && !match.result && (
        <p className="mt-2 text-xs text-amber-700 text-center font-medium">
          Predicciones bloqueadas por el administrador
        </p>
      )}

      {/* User prediction indicator */}
      {userPrediction && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Tu predicción:</span>
            <span className="font-medium text-gray-700">
              {userPrediction.team1Score} – {userPrediction.team2Score}
            </span>
          </div>
          {match.status === 'completed' && (
            <div className="flex items-center justify-between">
              <span>Tu score:</span>
              <span className="font-semibold text-green-700">
                {userPrediction.pointsEarned ?? 0} pts
              </span>
            </div>
          )}
        </div>
      )}

      {!userPrediction && !match.result && !match.predictionsBlocked && (
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold border border-blue-200">
            + Añadir predicción
          </span>
        </div>
      )}
    </div>
  );
}
