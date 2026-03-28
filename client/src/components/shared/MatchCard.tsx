import { clsx } from 'clsx';
import type { Match } from '../../types';
import { Badge } from '../ui/Badge';
import { formatShortDate, formatTime, isLocked } from '../../utils/timezone';

const statusLabel: Record<string, { label: string; variant: 'green' | 'blue' | 'yellow' | 'gray' }> = {
  scheduled: { label: 'Próximo', variant: 'blue' },
  in_progress: { label: 'En Vivo', variant: 'green' },
  completed: { label: 'Finalizado', variant: 'gray' },
  postponed: { label: 'Postergado', variant: 'yellow' },
};

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  userPrediction?: { team1Score: number; team2Score: number } | null;
}

export function MatchCard({ match, onClick, userPrediction }: MatchCardProps) {
  const { label, variant } = statusLabel[match.status] ?? { label: match.status, variant: 'gray' };
  const locked = isLocked(match.lockdownTime);

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
        <Badge variant={variant}>{label}</Badge>
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

      {/* User prediction indicator */}
      {userPrediction && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Tu predicción:</span>
          <span className="font-medium text-gray-700">
            {userPrediction.team1Score} – {userPrediction.team2Score}
          </span>
        </div>
      )}

      {/* Lockdown indicator for active predictions */}
      {!userPrediction && match.status === 'scheduled' && locked && (
        <p className="mt-2 text-xs text-red-500 text-center">🔒 Predicciones cerradas</p>
      )}
      {!userPrediction && match.status === 'scheduled' && !locked && (
        <p className="mt-2 text-xs text-blue-500 text-center">+ Agregar predicción</p>
      )}
    </div>
  );
}
