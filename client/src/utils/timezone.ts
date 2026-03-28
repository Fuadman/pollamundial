import type { TimeInfo } from '../types';

/**
 * Format a time (TimeInfo or ISO string) to the user's local timezone
 */
export function formatMatchTime(timeInfo: TimeInfo | string): string {
  const dateStr = typeof timeInfo === 'string' ? timeInfo : timeInfo.localTime;
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function formatDate(utcString: string): string {
  return new Date(utcString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(timeInfo: TimeInfo | string): string {
  const dateStr = typeof timeInfo === 'string' ? timeInfo : timeInfo.localTime;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timeInfo: TimeInfo | string): string {
  const dateStr = typeof timeInfo === 'string' ? timeInfo : timeInfo.localTime;
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function isAfter(utcString: string): boolean {
  return new Date() > new Date(utcString);
}

export function isLocked(lockdownTime: TimeInfo | string): boolean {
  const dateStr = typeof lockdownTime === 'string' ? lockdownTime : lockdownTime.utcTime;
  return isAfter(dateStr);
}

export function secondsUntil(utcString: string): number {
  return Math.max(0, Math.floor((new Date(utcString).getTime() - Date.now()) / 1000));
}
