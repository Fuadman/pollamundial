import { useEffect, useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { secondsUntil } from '../../utils/timezone';
import type { TimeInfo } from '../../types';

interface CountdownTimerProps {
  lockdownTime: TimeInfo | string;
  onLockdown?: () => void;
}

export function CountdownTimer({ lockdownTime, onLockdown }: CountdownTimerProps) {
  const lockdownTimeStr = typeof lockdownTime === 'string' ? lockdownTime : lockdownTime.utcTime;
  const [seconds, setSeconds] = useState(() => secondsUntil(lockdownTimeStr));

  useEffect(() => {
    if (seconds <= 0) {
      onLockdown?.();
      return;
    }
    const interval = setInterval(() => {
      const remaining = secondsUntil(lockdownTimeStr);
      setSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onLockdown?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockdownTimeStr, onLockdown, seconds]);

  if (seconds <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
        <ClockIcon className="h-4 w-4" />
        Predicción bloqueada
      </span>
    );
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const urgent = seconds < 300; // less than 5 minutes

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${urgent ? 'text-orange-600 animate-pulse' : 'text-gray-600'}`}
    >
      <ClockIcon className="h-4 w-4" />
      Cierra en{' '}
      {h > 0 && `${h}h `}
      {m > 0 && `${String(m).padStart(2, '0')}m `}
      {String(s).padStart(2, '0')}s
    </span>
  );
}
