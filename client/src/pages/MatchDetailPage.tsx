import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchMatch } from '../features/matches/matchesSlice';
import {
  fetchPredictionForMatch,
  fetchUserPredictions,
  submitPrediction,
  updatePrediction,
} from '../features/predictions/predictionsSlice';
import { addNotification } from '../features/ui/uiSlice';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatMatchTime } from '../utils/timezone';
import type { SubmitPredictionDto } from '../types';

export function MatchDetailPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const match = useAppSelector((s) => s.matches.currentMatch);
  const prediction = useAppSelector((s) => s.predictions.currentPrediction);
  const submitting = useAppSelector((s) => s.predictions.submitting);
  const user = useAppSelector((s) => s.auth.user);

  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (matchId) {
      dispatch(fetchMatch(matchId));
      dispatch(fetchPredictionForMatch(matchId));
    }
  }, [matchId, dispatch]);

  useEffect(() => {
    if (prediction) {
      setTeam1Score(prediction.predictedTeam1Score);
      setTeam2Score(prediction.predictedTeam2Score);
    }
  }, [prediction]);

  const derivedWinner = () => {
    if (team1Score > team2Score) return match?.team1.id ?? null;
    if (team2Score > team1Score) return match?.team2.id ?? null;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match || !user || match.result || match.predictionsBlocked) return;

    const data: SubmitPredictionDto = {
      matchId: match.id,
      predictedTeam1Score: team1Score,
      predictedTeam2Score: team2Score,
      predictedWinnerId: derivedWinner(),
      predictedDraw: team1Score === team2Score,
    };

    let result;
    if (prediction && editing) {
      result = await dispatch(updatePrediction({ predictionId: prediction.id, data }));
    } else {
      result = await dispatch(submitPrediction(data));
    }

    if (submitPrediction.fulfilled.match(result) || updatePrediction.fulfilled.match(result)) {
      dispatch(addNotification({ type: 'success', message: '✅ Predicción guardada' }));
      dispatch(fetchUserPredictions(user.id));
      setEditing(false);
    } else {
      dispatch(addNotification({ type: 'error', message: 'Error al guardar la predicción' }));
    }
  };

  if (!match) {
    return (
      <div className="flex justify-center py-20 text-gray-400">Cargando partido...</div>
    );
  }

  const hasPrediction = !!prediction;
  const showForm = !hasPrediction || editing;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
        ← Volver
      </button>

      {/* Match header */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {match.phase === 'group'
              ? `Fase de Grupos — Grupo ${match.groupStageGroup}`
              : `Eliminación — ${match.eliminationRound}`}
          </span>
          <Badge variant={match.status === 'in_progress' ? 'green' : match.status === 'completed' ? 'gray' : 'blue'}>
            {match.status === 'in_progress' ? '🔴 En Vivo' : match.status === 'completed' ? 'Finalizado' : 'Próximo'}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-gray-900">{match.team1.name}</p>
            <p className="text-xs text-gray-400 uppercase">{match.team1.code}</p>
          </div>
          <div className="text-center px-4">
            {match.result ? (
              <p className="text-4xl font-extrabold text-gray-900">
                {match.result.team1Score} – {match.result.team2Score}
              </p>
            ) : (
              <p className="text-2xl font-bold text-gray-300">vs</p>
            )}
          </div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-gray-900">{match.team2.name}</p>
            <p className="text-xs text-gray-400 uppercase">{match.team2.code}</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">{formatMatchTime(match.scheduledTime)}</p>

        {/* Lockdown */}
        {!match.result && (
          <div className="text-center">
            {match.predictionsBlocked ? (
              <Badge variant="yellow">Predicciones bloqueadas por admin</Badge>
            ) : (
              <Badge variant="blue">Predicciones abiertas hasta bloqueo del admin</Badge>
            )}
          </div>
        )}
      </div>

      {/* Prediction form or summary */}
      {!user?.registrationCompleted ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 text-center">
          Tu cuenta debe estar registrada para predecir este partido
        </div>
      ) : match.result && match.status === 'completed' && !hasPrediction ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 text-center">
          Partido finalizado — no tenías predicción para este partido
        </div>
      ) : hasPrediction && !editing ? (
        /* Prediction summary */
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Tu predicción</h2>
            {!match.result && !match.predictionsBlocked && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                ✏️ Editar
              </Button>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 text-3xl font-extrabold text-gray-900">
            <span>{prediction.predictedTeam1Score}</span>
            <span className="text-gray-300">–</span>
            <span>{prediction.predictedTeam2Score}</span>
          </div>
          {prediction.pointsEarned !== null && (
            <p className="text-center text-sm font-medium text-green-700">
              +{prediction.pointsEarned} puntos
            </p>
          )}
        </div>
      ) : showForm && !match.result && !match.predictionsBlocked ? (
        /* Prediction form */
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-6">
          <h2 className="font-semibold text-gray-900">
            {editing ? 'Editar predicción' : 'Ingresar predicción'}
          </h2>

          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-gray-700">{match.team1.name}</p>
              <input
                type="number"
                min={0}
                max={20}
                value={team1Score}
                onChange={(e) => setTeam1Score(Number(e.target.value))}
                className="w-20 text-center text-3xl font-bold rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none py-3"
              />
            </div>
            <span className="text-3xl font-bold text-gray-300">–</span>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-gray-700">{match.team2.name}</p>
              <input
                type="number"
                min={0}
                max={20}
                value={team2Score}
                onChange={(e) => setTeam2Score(Number(e.target.value))}
                className="w-20 text-center text-3xl font-bold rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none py-3"
              />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
            <p>🎯 <strong>3 pts</strong> — marcador exacto</p>
            <p>✅ <strong>2 pts</strong> — ganador correcto + diferencia de goles</p>
            <p>👍 <strong>1 pt</strong> &nbsp;— ganador o empate correcto</p>
          </div>

          <div className="flex gap-3">
            {editing && (
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
            <Button type="submit" className="flex-1" loading={submitting}>
              {editing ? 'Guardar cambios' : 'Guardar predicción'}
            </Button>
          </div>
        </form>
      ) : match.predictionsBlocked ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 text-center">
          El administrador bloqueó las predicciones para este partido
        </div>
      ) : null}
    </div>
  );
}
