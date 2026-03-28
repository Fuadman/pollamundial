import { useEffect } from 'react';
import { clsx } from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { removeNotification } from '../../features/ui/uiSlice';

const colorMap = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
};

function Toast({ id, type, message }: { id: string; type: string; message: string }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeNotification(id)), 4000);
    return () => clearTimeout(timer);
  }, [id, dispatch]);

  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md',
        colorMap[type as keyof typeof colorMap],
      )}
    >
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={() => dispatch(removeNotification(id))} className="mt-0.5 flex-shrink-0">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const notifications = useAppSelector((s) => s.ui.notifications);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {notifications.map((n) => (
        <Toast key={n.id} {...n} />
      ))}
    </div>
  );
}
