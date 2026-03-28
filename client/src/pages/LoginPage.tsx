import { useSearchParams } from 'react-router-dom';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const authError = searchParams.get('error');

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-700 to-green-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-6xl">⚽</div>
          <h1 className="text-3xl font-extrabold text-gray-900">Polla Mundial</h1>
          <p className="text-green-600 font-semibold">Copa Mundial 2026</p>
          <p className="text-gray-500 text-sm">
            Compite prediciendo los 104 partidos del torneo
          </p>
        </div>

        {/* Tournament info */}
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-1 text-sm text-green-800">
          <p className="font-semibold">🏆 Copa Mundial 2026</p>
          <p>📅 Fecha límite de inscripción: <strong>31 de mayo de 2026</strong></p>
          <p>🌍 USA · México · Canadá</p>
        </div>

        {authError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {authError}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 px-4 text-gray-700 font-medium shadow-sm hover:bg-gray-50 hover:shadow-md transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Iniciar sesión con Google
        </button>

        <p className="text-center text-xs text-gray-400">
          Al iniciar sesión aceptas los términos y condiciones del torneo
        </p>
      </div>
    </div>
  );
}
