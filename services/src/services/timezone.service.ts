import { Injectable } from '@nestjs/common';

interface TimezoneInfo {
  localTime: Date;
  offsetMinutes: number;
  abbreviation: string;
  utcTime: Date;
}

@Injectable()
export class TimezoneService {
  getTimezoneAbbreviation(offsetMinutes: number): string {
    const map: Record<number, string> = {};
    map[0] = 'UTC';
    map[-180] = 'BRT';
    map[-240] = 'ART';
    map[-300] = 'EST';
    map[-360] = 'CST';
    map[-420] = 'MST';
    map[-480] = 'PST';
    map[60] = 'CET';
    map[120] = 'EET';

    return map[offsetMinutes] || `UTC${this.formatOffset(offsetMinutes)}`;
  }

  private formatOffset(offsetMinutes: number): string {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    if (minutes === 0) {
      return `${sign}${hours}`;
    }
    return `${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  convertToUserTimezone(utcTime: Date, userTimezoneOffset?: number): TimezoneInfo {
    const offset = userTimezoneOffset ?? new Date().getTimezoneOffset() * -1;
    const localTime = new Date(utcTime.getTime() + offset * 60 * 1000);
    return {
      localTime,
      offsetMinutes: offset,
      abbreviation: this.getTimezoneAbbreviation(offset),
      utcTime,
    };
  }

  convertToLaPaz(utcTime: Date): TimezoneInfo {
    const laPazOffset = -240;
    return this.convertToUserTimezone(utcTime, laPazOffset);
  }

  getTimezoneFromHeader(timezoneHeader?: string): number {
    if (!timezoneHeader) {
      return 0;
    }
    const parsed = parseInt(timezoneHeader, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
    return 0;
  }

  formatTimeWithTimezone(utcTime: Date, userTimezoneOffset?: number): string {
    const converted = this.convertToUserTimezone(utcTime, userTimezoneOffset);
    const timeString = converted.localTime.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${timeString} ${converted.abbreviation}`;
  }

  isDaylightSavingTime(date: Date): boolean {
    return false;
  }

  getEffectiveOffset(date: Date, baseOffset: number): number {
    return baseOffset;
  }
}
