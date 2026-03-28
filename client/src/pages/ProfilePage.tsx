import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { authService } from '../services/auth.service';
import { clearAuth } from '../features/auth/authSlice';
import { addNotification } from '../features/ui/uiSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../utils/timezone';

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.register({ name: name.trim(), userId: user.id, email: user.email });
      dispatch(addNotification({ type: 'success', message: 'Perfil actualizado' }));
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Error al actualizar perfil' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // This would call a DELETE /api/users/me endpoint
    dispatch(clearAuth());
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-500 text-sm">Información de tu cuenta</p>
      </div>

      {/* Account status */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">Estado de la cuenta</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={user.registrationCompleted ? 'green' : 'yellow'}>
              {user.registrationCompleted ? '✅ Registro completado' : '⏳ Registro pendiente'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.paymentCompleted ? 'green' : 'yellow'}>
              {user.paymentCompleted ? '✅ Pago completado' : '⏳ Pago pendiente'}
            </Badge>
          </div>
          {user.role === 'admin' && <Badge variant="blue">🛡 Administrador</Badge>}
        </div>
        {user.registrationTimestamp && (
          <p className="text-xs text-gray-400">
            Inscrito el {formatDate(user.registrationTimestamp)}
          </p>
        )}
      </div>

      {/* Edit profile */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Editar información</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="profile-name"
            label="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="profile-email"
            label="Email"
            value={user.email}
            disabled
            className="bg-gray-50 text-gray-500"
          />
          <Button type="submit" loading={saving}>
            Guardar cambios
          </Button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-3">
        <h2 className="font-semibold text-red-800">Zona de peligro</h2>
        <p className="text-sm text-red-700">
          Al eliminar tu cuenta se borrarán todas tus predicciones y datos permanentemente.
        </p>
        {confirmDelete ? (
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete}>
              Confirmar eliminación
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Eliminar mi cuenta
          </Button>
        )}
      </div>
    </div>
  );
}
