import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const socketBaseUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io(socketBaseUrl, {
      path: '/socket.io',
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export const SocketEvents = {
  SCORE_UPDATE: 'score-update',
  MATCH_RESULT: 'match-result',
  LEADERBOARD_UPDATE: 'leaderboard-update',
  LOCKDOWN: 'lockdown',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
} as const;
