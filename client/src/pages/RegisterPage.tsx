import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchSession } from '../features/auth/authSlice';
import { addNotification } from '../features/ui/uiSlice';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await authService.register({ name: name.trim(), userId: user!.id, email: user!.email });
      await dispatch(fetchSession());
      navigate('/dashboard');
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Error al registrarse. Intenta de nuevo.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">Completa tu registro</h1>
          <p className="text-gray-500 text-sm">Paso 1 de 2 — Información personal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Nombre completo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Tu nombre"
            autoFocus
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={user?.email ?? ''}
            disabled
            className="bg-gray-50 text-gray-500"
          />

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Continuar al pago →
          </Button>
        </form>
      </div>
    </div>
  );
}
