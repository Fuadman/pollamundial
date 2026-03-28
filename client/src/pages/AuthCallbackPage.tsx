import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { setToken, fetchSession } from '../features/auth/authSlice';

/**
 * Landing page after Google OAuth callback.
 * Backend redirects here with ?token=<jwt>
 */
export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      dispatch(setToken(token));
      dispatch(fetchSession()).then((result) => {
        if (fetchSession.fulfilled.match(result)) {
          const user = result.payload.user;
          if (!user.registrationCompleted) {
            navigate('/register', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          navigate('/login', { replace: true });
        }
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50">
      <div className="text-center space-y-3">
        <div className="text-4xl animate-bounce">⚽</div>
        <p className="text-gray-600 font-medium">Autenticando...</p>
      </div>
    </div>
  );
}
