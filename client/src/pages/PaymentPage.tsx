import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { fetchSession } from '../features/auth/authSlice';
import { addNotification } from '../features/ui/uiSlice';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/Button';

export function PaymentPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Stub: in production this would integrate with Stripe/PayPal
  const handlePayment = async () => {
    setLoading(true);
    try {
      await authService.processPayment({ paymentToken: 'stub_token' });
      await dispatch(fetchSession());
      dispatch(addNotification({ type: 'success', message: '¡Pago completado! Ya puedes predecir.' }));
      navigate('/dashboard');
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Error al procesar el pago. Intenta de nuevo.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl">💳</div>
          <h1 className="text-2xl font-bold text-gray-900">Pago de inscripción</h1>
          <p className="text-gray-500 text-sm">Paso 2 de 2 — Confirma tu participación</p>
        </div>

        <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Inscripción Copa Mundial 2026</span>
            <span className="font-semibold text-gray-900">$XX.XX</span>
          </div>
          <div className="border-t border-green-200 pt-2 flex justify-between text-sm font-bold">
            <span>Total</span>
            <span className="text-green-700">$XX.XX</span>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
          ⚠ Fecha límite: <strong>31 de mayo de 2026</strong>. Después de esta fecha no se aceptan inscripciones.
        </div>

        <div className="space-y-3">
          <Button size="lg" className="w-full" onClick={handlePayment} loading={loading}>
            Confirmar pago
          </Button>
          <p className="text-center text-xs text-gray-400">
            Integración de pago segura — Stripe / PayPal
          </p>
        </div>
      </div>
    </div>
  );
}
