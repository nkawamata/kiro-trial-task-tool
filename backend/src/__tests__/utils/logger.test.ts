import { logger } from '../../utils/logger';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Replace console methods
Object.assign(console, mockConsole);

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Test info message'));
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Test error message'));
  });

  it('should log warn messages', () => {
    logger.warn('Test warn message');
    expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('Test warn message'));
  });

  it('should log success messages', () => {
    logger.success('Test success message');
    expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Test success message'));
  });

  it('should handle debug messages in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    logger.debug('Test debug message');
    expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Test debug message'));
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should not log debug messages in test environment', () => {
    logger.debug('Test debug message');
    expect(mockConsole.log).not.toHaveBeenCalledWith(expect.stringContaining('Test debug message'));
  });

  it('should handle objects in log messages', () => {
    const testObj = { key: 'value', number: 42 };
    logger.info('Test with object', testObj);
    expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Test with object'), testObj);
  });

  it('should handle errors in log messages', () => {
    const testError = new Error('Test error');
    logger.error('Error occurred', testError);
    expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Error occurred'), testError);
  });

  it('should format messages with timestamps', () => {
    logger.info('Test message');
    expect(mockConsole.log).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\].*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z.*Test message/));
  });
});