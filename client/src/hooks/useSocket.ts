import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket, SocketEvents } from '../services/socket.service';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { updateMatchInList } from '../features/matches/matchesSlice';
import { updateEntries } from '../features/leaderboard/leaderboardSlice';
import { addNotification, setSimulationMode } from '../features/ui/uiSlice';

/**
 * Initializes the Socket.io connection and registers all global event listeners.
 * Must be used once inside the authenticated app tree.
 */
export function useSocket() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on(SocketEvents.SCORE_UPDATE, (data: { match: unknown }) => {
      if (data.match) {
        dispatch(updateMatchInList(data.match as Parameters<typeof updateMatchInList>[0]));
      }
    });

    socket.on(SocketEvents.MATCH_RESULT, (data: { match: unknown; message?: string }) => {
      if (data.match) {
        dispatch(updateMatchInList(data.match as Parameters<typeof updateMatchInList>[0]));
      }
      dispatch(addNotification({
        type: 'info',
        message: data.message ?? '⚽ Resultado publicado',
      }));
    });

    socket.on(SocketEvents.LEADERBOARD_UPDATE, (data: { entries: unknown[] }) => {
      if (data.entries) {
        dispatch(updateEntries(data.entries as Parameters<typeof updateEntries>[0]));
      }
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
  }, [token, dispatch]);

  // Disconnect on logout
  useEffect(() => {
    if (!token) disconnectSocket();
  }, [token]);
}
