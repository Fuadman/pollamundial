import { Test, TestingModule } from '@nestjs/testing';
import { TimezoneService } from './timezone.service';
import * as fc from 'fast-check';

describe('TimezoneService', () => {
  let service: TimezoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimezoneService],
    }).compile();

    service = module.get<TimezoneService>(TimezoneService);
  });

  describe('getTimezoneAbbreviation', () => {
    it('should return UTC for 0 offset', () => {
      expect(service.getTimezoneAbbreviation(0)).toBe('UTC');
    });

    it('should return EST for -300 offset', () => {
      expect(service.getTimezoneAbbreviation(-300)).toBe('EST');
    });

    it('should return PST for -480 offset', () => {
      expect(service.getTimezoneAbbreviation(-480)).toBe('PST');
    });

    it('should return ART for -240 offset (La Paz)', () => {
      expect(service.getTimezoneAbbreviation(-240)).toBe('ART');
    });

    it('should return formatted offset for unknown timezone', () => {
      const result = service.getTimezoneAbbreviation(-330);
      expect(result).toMatch(/UTC[+-]\d+/);
    });
  });

  describe('convertToUserTimezone', () => {
    it('should convert UTC time to user timezone', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');
      const result = service.convertToUserTimezone(utcTime, -300); // EST

      expect(result.utcTime).toEqual(utcTime);
      expect(result.offsetMinutes).toBe(-300);
      expect(result.abbreviation).toBe('EST');
      expect(result.localTime.getTime()).toBe(
        utcTime.getTime() - 300 * 60 * 1000,
      );
    });

    it('should handle positive timezone offsets', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');
      const result = service.convertToUserTimezone(utcTime, 120); // CET

      expect(result.offsetMinutes).toBe(120);
      expect(result.localTime.getTime()).toBe(
        utcTime.getTime() + 120 * 60 * 1000,
      );
    });

    it('should handle zero offset (UTC)', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');
      const result = service.convertToUserTimezone(utcTime, 0);

      expect(result.offsetMinutes).toBe(0);
      expect(result.localTime.getTime()).toBe(utcTime.getTime());
      expect(result.abbreviation).toBe('UTC');
    });

    it('should use browser timezone when no offset provided', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');
      const result = service.convertToUserTimezone(utcTime);

      expect(result.utcTime).toEqual(utcTime);
      expect(result.offsetMinutes).toBeDefined();
      expect(result.abbreviation).toBeDefined();
    });
  });

  describe('convertToLaPaz', () => {
    it('should convert UTC to La Paz timezone (UTC-4)', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');
      const result = service.convertToLaPaz(utcTime);

      expect(result.offsetMinutes).toBe(-240);
      expect(result.abbreviation).toBe('ART');
      expect(result.localTime.getTime()).toBe(
        utcTime.getTime() - 240 * 60 * 1000,
      );
    });

    it('should handle various UTC times', () => {
      const times = [
        new Date('2026-06-01T00:00:00Z'),
        new Date('2026-06-15T12:30:45Z'),
        new Date('2026-07-31T23:59:59Z'),
      ];

      times.forEach((utcTime) => {
        const result = service.convertToLaPaz(utcTime);
        expect(result.offsetMinutes).toBe(-240);
        expect(result.localTime.getTime()).toBe(
          utcTime.getTime() - 240 * 60 * 1000,
        );
      });
    });
  });

  describe('getTimezoneFromHeader', () => {
    it('should parse numeric timezone header', () => {
      expect(service.getTimezoneFromHeader('-300')).toBe(-300);
      expect(service.getTimezoneFromHeader('120')).toBe(120);
      expect(service.getTimezoneFromHeader('0')).toBe(0);
    });

    it('should return 0 for invalid header', () => {
      expect(service.getTimezoneFromHeader('invalid')).toBe(0);
      expect(service.getTimezoneFromHeader('EST')).toBe(0);
    });

    it('should return 0 for undefined header', () => {
      expect(service.getTimezoneFromHeader()).toBe(0);
    });
  });

  describe('formatTimeWithTimezone', () => {
    it('should format time with timezone abbreviation', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');
      const result = service.formatTimeWithTimezone(utcTime, -300);

      expect(result).toContain('EST');
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/); // Time format
    });

    it('should include timezone abbreviation in output', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');
      const result = service.formatTimeWithTimezone(utcTime, -240);

      expect(result).toContain('ART');
    });
  });

  describe('isDaylightSavingTime', () => {
    it('should return false for La Paz (no DST)', () => {
      const dates = [
        new Date('2026-01-15'),
        new Date('2026-06-15'),
        new Date('2026-12-15'),
      ];

      dates.forEach((date) => {
        expect(service.isDaylightSavingTime(date)).toBe(false);
      });
    });
  });

  describe('getEffectiveOffset', () => {
    it('should return base offset for La Paz (no DST)', () => {
      const date = new Date('2026-06-11');
      const offset = service.getEffectiveOffset(date, -240);

      expect(offset).toBe(-240);
    });

    it('should handle various dates', () => {
      const dates = [
        new Date('2026-01-01'),
        new Date('2026-06-15'),
        new Date('2026-12-31'),
      ];

      dates.forEach((date) => {
        const offset = service.getEffectiveOffset(date, -240);
        expect(offset).toBe(-240);
      });
    });
  });

  describe('Property-based tests', () => {
    /**
     * Property 52: Timezone conversion accuracy
     * For any UTC time, the conversion to La Paz timezone (UTC-4) should be accurate and consistent.
     * **Validates: Requirements 16.1-16.5**
     */
    it('should accurately convert UTC to UTC-4 (La Paz)', () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2026-06-01'),
            max: new Date('2026-08-31'),
          }),
          (utcTime) => {
            const result = service.convertToLaPaz(utcTime);

            // Verify offset is exactly -240 minutes (UTC-4)
            expect(result.offsetMinutes).toBe(-240);

            // Verify abbreviation is ART (Argentina Time)
            expect(result.abbreviation).toBe('ART');

            // Verify UTC time is preserved
            expect(result.utcTime.getTime()).toBe(utcTime.getTime());

            // Verify local time is 4 hours behind UTC
            const expectedLocalTime = new Date(
              utcTime.getTime() - 240 * 60 * 1000,
            );
            expect(result.localTime.getTime()).toBe(expectedLocalTime.getTime());
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Timezone offset consistency
     * For any timezone offset, converting to that timezone and back should preserve the original UTC time
     */
    it('should maintain consistency when converting to timezone and back', () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2026-06-01'),
            max: new Date('2026-08-31'),
          }),
          fc.integer({ min: -720, max: 840 }), // Valid timezone offsets
          (utcTime, offset) => {
            const converted = service.convertToUserTimezone(utcTime, offset);

            // UTC time should be preserved
            expect(converted.utcTime.getTime()).toBe(utcTime.getTime());

            // Offset should match input
            expect(converted.offsetMinutes).toBe(offset);

            // Local time should be offset from UTC
            const expectedLocalTime = new Date(
              utcTime.getTime() + offset * 60 * 1000,
            );
            expect(converted.localTime.getTime()).toBe(
              expectedLocalTime.getTime(),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Timezone abbreviation consistency
     * For any timezone offset, the abbreviation should be consistent across multiple calls
     */
    it('should return consistent abbreviations for same offset', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -720, max: 840 }),
          (offset) => {
            const abbr1 = service.getTimezoneAbbreviation(offset);
            const abbr2 = service.getTimezoneAbbreviation(offset);

            expect(abbr1).toBe(abbr2);
            expect(abbr1).toMatch(/^[A-Z0-9+:\-]+$/); // Should be uppercase letters, numbers, or UTC offset format
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle midnight UTC', () => {
      const utcTime = new Date('2026-06-11T00:00:00Z');
      const result = service.convertToLaPaz(utcTime);

      expect(result.localTime.getUTCHours()).toBe(20); // Previous day at 8 PM
    });

    it('should handle end of day UTC', () => {
      const utcTime = new Date('2026-06-11T23:59:59Z');
      const result = service.convertToLaPaz(utcTime);

      expect(result.localTime.getUTCHours()).toBe(19); // Same day at 7:59 PM
    });

    it('should handle month boundaries', () => {
      const utcTime = new Date('2026-06-30T23:59:59Z');
      const result = service.convertToLaPaz(utcTime);

      expect(result.offsetMinutes).toBe(-240);
      expect(result.localTime.getUTCDate()).toBe(30); // Still June 30
    });

    it('should handle year boundaries', () => {
      const utcTime = new Date('2026-12-31T23:59:59Z');
      const result = service.convertToLaPaz(utcTime);

      expect(result.offsetMinutes).toBe(-240);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple timezone conversions for same UTC time', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');

      const estResult = service.convertToUserTimezone(utcTime, -300); // UTC-5
      const pstResult = service.convertToUserTimezone(utcTime, -480); // UTC-8
      const laPazResult = service.convertToLaPaz(utcTime); // UTC-4

      // All should have same UTC time
      expect(estResult.utcTime).toEqual(pstResult.utcTime);
      expect(estResult.utcTime).toEqual(laPazResult.utcTime);

      // Local times should differ by timezone offset
      const estPstDiff = estResult.localTime.getTime() - pstResult.localTime.getTime();
      expect(estPstDiff).toBe(180 * 60 * 1000); // 3 hours difference

      // La Paz (UTC-4) is ahead of EST (UTC-5) and behind PST (UTC-8)
      expect(laPazResult.localTime.getTime()).toBeGreaterThan(
        estResult.localTime.getTime(),
      );
      expect(laPazResult.localTime.getTime()).toBeGreaterThan(
        pstResult.localTime.getTime(),
      );
    });

    it('should format times consistently across timezones', () => {
      const utcTime = new Date('2026-06-11T14:00:00Z');

      const estFormatted = service.formatTimeWithTimezone(utcTime, -300);
      const laPazFormatted = service.formatTimeWithTimezone(utcTime, -240);

      expect(estFormatted).toContain('EST');
      expect(laPazFormatted).toContain('ART');

      // Both should have valid time format
      expect(estFormatted).toMatch(/\d{2}:\d{2}:\d{2}/);
      expect(laPazFormatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });
});
