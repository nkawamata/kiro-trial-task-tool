import {
  formatDate,
  parseDate,
  isDateInRange,
  getDateRange,
  addDays,
  subtractDays,
  getDaysDifference,
  formatDateForAPI,
  isWeekend,
  getWorkingDays,
  formatDuration,
  calculateDuration,
  isToday,
  isOverdue,
  getWeekStart,
  getMonthStart,
  getQuarterStart,
  formatDateRange
} from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should handle date string input', () => {
      expect(formatDate('2024-01-15')).toBe('2024-01-15');
    });

    it('should format with custom format', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(formatDate(date, 'MM/dd/yyyy')).toBe('01/15/2024');
    });
  });

  describe('parseDate', () => {
    it('should parse date string correctly', () => {
      const result = parseDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(15);
    });

    it('should handle invalid date string', () => {
      expect(() => parseDate('invalid-date')).toThrow();
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date within range', () => {
      const date = new Date('2024-01-15');
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      expect(isDateInRange(date, startDate, endDate)).toBe(true);
    });

    it('should return false for date outside range', () => {
      const date = new Date('2024-02-15');
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      expect(isDateInRange(date, startDate, endDate)).toBe(false);
    });

    it('should include boundary dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      expect(isDateInRange(startDate, startDate, endDate)).toBe(true);
      expect(isDateInRange(endDate, startDate, endDate)).toBe(true);
    });
  });

  describe('getDateRange', () => {
    it('should generate date range correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');

      const range = getDateRange(startDate, endDate);

      expect(range).toHaveLength(3);
      expect(range[0]).toEqual(startDate);
      expect(range[1]).toEqual(new Date('2024-01-02'));
      expect(range[2]).toEqual(endDate);
    });

    it('should handle single day range', () => {
      const date = new Date('2024-01-01');
      const range = getDateRange(date, date);

      expect(range).toHaveLength(1);
      expect(range[0]).toEqual(date);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 5);

      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should handle month overflow', () => {
      const date = new Date('2024-01-30');
      const result = addDays(date, 5);

      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1); // February
    });

    it('should handle negative days', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, -5);

      expect(result.getDate()).toBe(10);
    });
  });

  describe('subtractDays', () => {
    it('should subtract days correctly', () => {
      const date = new Date('2024-01-15');
      const result = subtractDays(date, 5);

      expect(result.getDate()).toBe(10);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should handle month underflow', () => {
      const date = new Date('2024-02-03');
      const result = subtractDays(date, 5);

      expect(result.getDate()).toBe(29); // January 29 (2024 is leap year)
      expect(result.getMonth()).toBe(0); // January
    });
  });

  describe('getDaysDifference', () => {
    it('should calculate days difference correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-11');

      expect(getDaysDifference(date1, date2)).toBe(10);
      expect(getDaysDifference(date2, date1)).toBe(-10);
    });

    it('should handle same date', () => {
      const date = new Date('2024-01-01');
      expect(getDaysDifference(date, date)).toBe(0);
    });
  });

  describe('formatDateForAPI', () => {
    it('should format date for API correctly', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(formatDateForAPI(date)).toBe('2024-01-15');
    });

    it('should handle date string input', () => {
      expect(formatDateForAPI('2024-01-15')).toBe('2024-01-15');
    });
  });

  describe('isWeekend', () => {
    it('should identify Saturday as weekend', () => {
      const saturday = new Date('2024-01-13'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should identify Sunday as weekend', () => {
      const sunday = new Date('2024-01-14'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should identify weekday as not weekend', () => {
      const monday = new Date('2024-01-15'); // Monday
      expect(isWeekend(monday)).toBe(false);
    });
  });

  describe('getWorkingDays', () => {
    it('should calculate working days correctly', () => {
      const startDate = new Date('2024-01-15'); // Monday
      const endDate = new Date('2024-01-19'); // Friday

      expect(getWorkingDays(startDate, endDate)).toBe(5);
    });

    it('should exclude weekends', () => {
      const startDate = new Date('2024-01-13'); // Saturday
      const endDate = new Date('2024-01-21'); // Sunday

      // Should count Mon-Fri (5 days) in between
      expect(getWorkingDays(startDate, endDate)).toBe(5);
    });

    it('should handle single day', () => {
      const monday = new Date('2024-01-15'); // Monday
      expect(getWorkingDays(monday, monday)).toBe(1);

      const saturday = new Date('2024-01-13'); // Saturday
      expect(getWorkingDays(saturday, saturday)).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format single day', () => {
      expect(formatDuration(1)).toBe('1 day');
    });

    it('should format multiple days', () => {
      expect(formatDuration(5)).toBe('5 days');
    });

    it('should format single week', () => {
      expect(formatDuration(7)).toBe('1 week');
    });

    it('should format multiple weeks', () => {
      expect(formatDuration(14)).toBe('2 weeks');
    });

    it('should format weeks and days', () => {
      expect(formatDuration(10)).toBe('1 week, 3 days');
      expect(formatDuration(17)).toBe('2 weeks, 3 days');
    });

    it('should format weeks and single day', () => {
      expect(formatDuration(8)).toBe('1 week, 1 day');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration in days', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');
      expect(calculateDuration(start, end)).toBe(4);
    });

    it('should handle same day', () => {
      const date = new Date('2024-01-01');
      expect(calculateDuration(date, date)).toBe(0);
    });

    it('should round up partial days', () => {
      const start = new Date('2024-01-01T10:00:00');
      const end = new Date('2024-01-02T08:00:00');
      expect(calculateDuration(start, end)).toBe(1);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(isOverdue(today)).toBe(false);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isOverdue(futureDate)).toBe(false);
    });
  });

  describe('getWeekStart', () => {
    it('should return start of week (Sunday)', () => {
      const wednesday = new Date('2024-01-03'); // Wednesday
      const weekStart = getWeekStart(wednesday);
      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekStart.getDate()).toBe(31); // Dec 31, 2023
    });

    it('should handle Sunday correctly', () => {
      const sunday = new Date('2023-12-31'); // Sunday
      const weekStart = getWeekStart(sunday);
      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekStart.getDate()).toBe(31);
    });
  });

  describe('getMonthStart', () => {
    it('should return first day of month', () => {
      const date = new Date('2024-01-15');
      const monthStart = getMonthStart(date);
      expect(monthStart.getDate()).toBe(1);
      expect(monthStart.getMonth()).toBe(0); // January
      expect(monthStart.getFullYear()).toBe(2024);
    });

    it('should handle different months', () => {
      const date = new Date('2024-06-30');
      const monthStart = getMonthStart(date);
      expect(monthStart.getDate()).toBe(1);
      expect(monthStart.getMonth()).toBe(5); // June
    });
  });

  describe('getQuarterStart', () => {
    it('should return Q1 start for January-March', () => {
      const jan = new Date('2024-01-15');
      const feb = new Date('2024-02-15');
      const mar = new Date('2024-03-15');
      
      [jan, feb, mar].forEach(date => {
        const quarterStart = getQuarterStart(date);
        expect(quarterStart.getMonth()).toBe(0); // January
        expect(quarterStart.getDate()).toBe(1);
      });
    });

    it('should return Q2 start for April-June', () => {
      const apr = new Date('2024-04-15');
      const may = new Date('2024-05-15');
      const jun = new Date('2024-06-15');
      
      [apr, may, jun].forEach(date => {
        const quarterStart = getQuarterStart(date);
        expect(quarterStart.getMonth()).toBe(3); // April
        expect(quarterStart.getDate()).toBe(1);
      });
    });

    it('should return Q3 start for July-September', () => {
      const jul = new Date('2024-07-15');
      const quarterStart = getQuarterStart(jul);
      expect(quarterStart.getMonth()).toBe(6); // July
      expect(quarterStart.getDate()).toBe(1);
    });

    it('should return Q4 start for October-December', () => {
      const oct = new Date('2024-10-15');
      const quarterStart = getQuarterStart(oct);
      expect(quarterStart.getMonth()).toBe(9); // October
      expect(quarterStart.getDate()).toBe(1);
    });
  });

  describe('formatDateRange', () => {
    it('should format date range within same year', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-03-20');
      const result = formatDateRange(start, end);
      expect(result).toContain('Jan 15');
      expect(result).toContain('Mar 20');
      expect(result).toContain(' - ');
    });

    it('should include year for different years', () => {
      const start = new Date('2023-12-15');
      const end = new Date('2024-01-20');
      const result = formatDateRange(start, end);
      expect(result).toContain('2023');
      expect(result).toContain('2024');
    });
  });
});