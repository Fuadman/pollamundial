import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchSession } from '../../features/auth/authSlice';
import { useSocket } from '../../hooks/useSocket';

/**
 * Bootstraps the app: fetches session on mount, initializes WebSocket.
 */
export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchSession());
    }
  }, []); // only on mount

  useSocket();

  return <>{children}</>;
}
