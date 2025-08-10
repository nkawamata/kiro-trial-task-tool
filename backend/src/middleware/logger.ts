import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

// Custom token for user ID
morgan.token('user-id', (req: any) => {
  return req.user?.sub || 'anonymous';
});

// Custom token for user email
morgan.token('user-email', (req: any) => {
  return req.user?.email || req.user?.username || 'unknown';
});

// Custom token for status code with colors
morgan.token('status-colored', (req, res) => {
  const status = res.statusCode;
  if (status >= 500) {
    return `\x1b[31m${status}\x1b[0m`; // Red for 5xx
  } else if (status >= 400) {
    return `\x1b[33m${status}\x1b[0m`; // Yellow for 4xx
  } else if (status >= 300) {
    return `\x1b[36m${status}\x1b[0m`; // Cyan for 3xx
  } else {
    return `\x1b[32m${status}\x1b[0m`; // Green for 2xx
  }
});

// Development format with colors and user info
const developmentFormat = [
  '\x1b[90m:date[iso]\x1b[0m', // Gray timestamp
  '\x1b[36m:method\x1b[0m',     // Cyan method
  '\x1b[37m:url\x1b[0m',        // White URL
  ':status-colored',             // Colored status
  '\x1b[35m:response-time ms\x1b[0m', // Magenta response time
  '\x1b[90m:user-id\x1b[0m',    // Gray user ID
  '\x1b[90m(:user-email)\x1b[0m' // Gray user email
].join(' ');

// Production format (no colors)
const productionFormat = ':date[iso] :method :url :status :response-time ms :user-id (:user-email)';

// Create logger middleware
export const accessLogger = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    // Skip health checks in production
    skip: (req, res) => {
      if (process.env.NODE_ENV === 'production' && req.url === '/health') {
        return true;
      }
      return false;
    }
  }
);

// Error logger for failed requests
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const userInfo = (req as any).user ? `${(req as any).user.sub} (${(req as any).user.email || (req as any).user.username})` : 'anonymous';
  
  console.error(`\x1b[31m[ERROR]\x1b[0m ${timestamp} ${req.method} ${req.url} - User: ${userInfo}`);
  console.error(`\x1b[31mError:\x1b[0m`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp
  });
  
  next(err);
};