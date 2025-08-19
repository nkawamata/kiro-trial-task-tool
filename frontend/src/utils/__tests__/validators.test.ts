import {
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  isValidUrl,
  isValidDate,
  isValidNumber,
  isValidInteger,
  isInRange,
  hasMinLength,
  hasMaxLength,
  isRequired,
  matchesPattern,
  isValidCreditCard,
  isValidZipCode
} from '../validators';

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('MySecure1Pass')).toBe(true);
      expect(isValidPassword('Test123!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isValidPassword('password')).toBe(false); // no uppercase, no number
      expect(isValidPassword('PASSWORD')).toBe(false); // no lowercase, no number
      expect(isValidPassword('Password')).toBe(false); // no number
      expect(isValidPassword('Pass1')).toBe(false); // too short
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhoneNumber('123-456-7890')).toBe(true);
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true);
      expect(isValidPhoneNumber('123.456.7890')).toBe(true);
      expect(isValidPhoneNumber('1234567890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123-456-789')).toBe(false); // too short
      expect(isValidPhoneNumber('123-456-78901')).toBe(false); // too long
      expect(isValidPhoneNumber('abc-def-ghij')).toBe(false); // letters
      expect(isValidPhoneNumber('')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://test.org')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/path')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('just-text')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct date strings', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('01/15/2024')).toBe(true);
      expect(isValidDate('2024-01-15T10:30:00Z')).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2024-13-01')).toBe(false); // invalid month
      expect(isValidDate('2024-01-32')).toBe(false); // invalid day
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('isValidNumber', () => {
    it('should validate numbers', () => {
      expect(isValidNumber('123')).toBe(true);
      expect(isValidNumber('123.45')).toBe(true);
      expect(isValidNumber('-123')).toBe(true);
      expect(isValidNumber('0')).toBe(true);
    });

    it('should reject non-numbers', () => {
      expect(isValidNumber('abc')).toBe(false);
      expect(isValidNumber('')).toBe(false);
      expect(isValidNumber('123abc')).toBe(false);
      expect(isValidNumber('Infinity')).toBe(false);
    });
  });

  describe('isValidInteger', () => {
    it('should validate integers', () => {
      expect(isValidInteger('123')).toBe(true);
      expect(isValidInteger('-123')).toBe(true);
      expect(isValidInteger('0')).toBe(true);
    });

    it('should reject non-integers', () => {
      expect(isValidInteger('123.45')).toBe(false);
      expect(isValidInteger('abc')).toBe(false);
      expect(isValidInteger('')).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should validate numbers in range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true); // boundary
      expect(isInRange(10, 1, 10)).toBe(true); // boundary
    });

    it('should reject numbers out of range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
      expect(isInRange(-5, 1, 10)).toBe(false);
    });
  });

  describe('hasMinLength', () => {
    it('should validate minimum length', () => {
      expect(hasMinLength('hello', 3)).toBe(true);
      expect(hasMinLength('hello', 5)).toBe(true);
    });

    it('should reject strings too short', () => {
      expect(hasMinLength('hi', 3)).toBe(false);
      expect(hasMinLength('', 1)).toBe(false);
    });
  });

  describe('hasMaxLength', () => {
    it('should validate maximum length', () => {
      expect(hasMaxLength('hello', 10)).toBe(true);
      expect(hasMaxLength('hello', 5)).toBe(true);
    });

    it('should reject strings too long', () => {
      expect(hasMaxLength('hello world', 5)).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('should validate required values', () => {
      expect(isRequired('hello')).toBe(true);
      expect(isRequired('0')).toBe(true);
      expect(isRequired(0)).toBe(true);
      expect(isRequired(false)).toBe(true);
    });

    it('should reject empty values', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false); // whitespace only
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe('matchesPattern', () => {
    it('should validate pattern matches', () => {
      expect(matchesPattern('abc123', /^[a-z]+\d+$/)).toBe(true);
      expect(matchesPattern('test@example.com', /\S+@\S+\.\S+/)).toBe(true);
    });

    it('should reject pattern mismatches', () => {
      expect(matchesPattern('ABC123', /^[a-z]+\d+$/)).toBe(false);
      expect(matchesPattern('invalid', /\S+@\S+\.\S+/)).toBe(false);
    });
  });

  describe('isValidCreditCard', () => {
    it('should validate correct credit card numbers', () => {
      expect(isValidCreditCard('4532015112830366')).toBe(true); // Visa test number
      expect(isValidCreditCard('4532-0151-1283-0366')).toBe(true); // with dashes
      expect(isValidCreditCard('4532 0151 1283 0366')).toBe(true); // with spaces
    });

    it('should reject invalid credit card numbers', () => {
      expect(isValidCreditCard('1234567890123456')).toBe(false); // fails Luhn
      expect(isValidCreditCard('123')).toBe(false); // too short
      expect(isValidCreditCard('abcd1234567890123456')).toBe(false); // contains letters
      expect(isValidCreditCard('')).toBe(false);
    });
  });

  describe('isValidZipCode', () => {
    it('should validate correct ZIP codes', () => {
      expect(isValidZipCode('12345')).toBe(true);
      expect(isValidZipCode('12345-6789')).toBe(true);
    });

    it('should reject invalid ZIP codes', () => {
      expect(isValidZipCode('1234')).toBe(false); // too short
      expect(isValidZipCode('123456')).toBe(false); // too long
      expect(isValidZipCode('abcde')).toBe(false); // letters
      expect(isValidZipCode('12345-678')).toBe(false); // invalid +4 format
      expect(isValidZipCode('')).toBe(false);
    });
  });
});