import {
  formatCurrency,
  formatPercentage,
  formatFileSize,
  formatPhoneNumber,
  truncateText,
  capitalizeFirst,
  slugify,
  formatDuration,
  formatNumber,
  formatRelativeTime
} from '../formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%');
      expect(formatPercentage(0.5)).toBe('50.0%');
      expect(formatPercentage(1)).toBe('100.0%');
      expect(formatPercentage(0.1234, 2)).toBe('12.34%');
    });
  });

  describe('formatFileSize', () => {
    it('should format file size correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format phone number correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('123')).toBe('123');
    });
  });

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      expect(truncateText('Hello World', 20)).toBe('Hello World');
      expect(truncateText('Hello World', 5)).toBe('Hello...');
      expect(truncateText('Hi', 10)).toBe('Hi');
      expect(truncateText('', 5)).toBe('');
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter correctly', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('HELLO')).toBe('Hello');
      expect(capitalizeFirst('hELLO')).toBe('Hello');
      expect(capitalizeFirst('')).toBe('');
      expect(capitalizeFirst('h')).toBe('H');
    });
  });

  describe('slugify', () => {
    it('should create URL-friendly slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Hello, World!')).toBe('hello-world');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(slugify('Special@#$%Characters')).toBe('specialcharacters');
      expect(slugify('Already-Slugified')).toBe('already-slugified');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(3661)).toBe('1h 1m 1s');
      expect(formatDuration(7200)).toBe('2h 0m 0s');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1234.567)).toBe('1,235');
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time correctly', () => {
      const now = new Date();
      
      // Just now
      const justNow = new Date(now.getTime() - 30 * 1000);
      expect(formatRelativeTime(justNow)).toBe('just now');
      
      // Minutes ago
      const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(minutesAgo)).toBe('5 minutes ago');
      
      // Hours ago
      const hoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(hoursAgo)).toBe('2 hours ago');
      
      // Days ago
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(daysAgo)).toBe('3 days ago');
    });
  });
});