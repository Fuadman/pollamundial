import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket, SocketEvents } from '../services/socket.service';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchMatch,
  fetchMatches,
  updateMatchInList,
} from '../features/matches/matchesSlice';
import { fetchLeaderboard, updateEntries } from '../features/leaderboard/leaderboardSlice';
import { addNotification, setSimulationMode } from '../features/ui/uiSlice';
import { fetchUserPredictions } from '../features/predictions/predictionsSlice';

/**
 * Initializes the Socket.io connection and registers all global event listeners.
 * Must be used once inside the authenticated app tree.
 */
export function useSocket() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const leaderboardPhase = useAppSelector((s) => s.leaderboard.phase);
  const leaderboardPage = useAppSelector((s) => s.leaderboard.page);
  const matchFilters = useAppSelector((s) => s.matches.filters);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on(SocketEvents.SCORE_UPDATE, (data: { match?: unknown; matchId?: string }) => {
      if (data.match) {
        dispatch(updateMatchInList(data.match as Parameters<typeof updateMatchInList>[0]));
      } else if (data.matchId) {
        dispatch(fetchMatch(data.matchId));
      }
    });

    socket.on(SocketEvents.MATCH_RESULT, (data: { match?: unknown; matchId?: string; message?: string }) => {
      if (data.match) {
        dispatch(updateMatchInList(data.match as Parameters<typeof updateMatchInList>[0]));
      }

      if (data.matchId) {
        dispatch(fetchMatch(data.matchId));
        if (userId) {
          dispatch(fetchUserPredictions(userId));
        }
      }

      // Pull fresh list so auto-generated elimination matches become visible immediately.
      dispatch(fetchMatches(matchFilters));

      dispatch(addNotification({
        type: 'info',
        message: data.message ?? '⚽ Resultado publicado',
      }));
    });

    socket.on(SocketEvents.LEADERBOARD_UPDATE, (data: { entries: unknown[] }) => {
      if (data.entries) {
        dispatch(updateEntries(data.entries as Parameters<typeof updateEntries>[0]));
      }

      // Pull authoritative ranking for current phase/page so UI stays in sync.
      dispatch(fetchLeaderboard({ phase: leaderboardPhase, page: leaderboardPage }));
    });

    socket.on(SocketEvents.LOCKDOWN, (data: { matchId: string; message?: string }) => {
      dispatch(addNotification({
        type: 'warning',
        message: data.message ?? '🔒 Predicciones bloqueadas para un partido',
      }));
    });

    socket.on('simulation-mode', (data: { active: boolean }) => {
      dispatch(setSimulationMode(data.active));
    });

    return () => {
      socket.off(SocketEvents.SCORE_UPDATE);
      socket.off(SocketEvents.MATCH_RESULT);
      socket.off(SocketEvents.LEADERBOARD_UPDATE);
      socket.off(SocketEvents.LOCKDOWN);
      socket.off('simulation-mode');
    };
  }, [token, userId, leaderboardPhase, leaderboardPage, matchFilters, dispatch]);

  // Disconnect on logout
  useEffect(() => {
    if (!token) disconnectSocket();
  }, [token]);
}
