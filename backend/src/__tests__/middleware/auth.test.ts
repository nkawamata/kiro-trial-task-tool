import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { verifyOIDCToken } from '../../services/oidcService';

// Mock the OIDC service
jest.mock('../../services/oidcService');
const mockVerifyOIDCToken = verifyOIDCToken as jest.MockedFunction<typeof verifyOIDCToken>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', async () => {
    const mockUser = {
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-token'
    };

    mockVerifyOIDCToken.mockResolvedValue(mockUser);

    await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockVerifyOIDCToken).toHaveBeenCalledWith('valid-token');
    expect(mockRequest.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject request without authorization header', async () => {
    await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject request with invalid authorization format', async () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token'
    };

    await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token'
    };

    mockVerifyOIDCToken.mockRejectedValue(new Error('Invalid token'));

    await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle token verification error', async () => {
    mockRequest.headers = {
      authorization: 'Bearer some-token'
    };

    mockVerifyOIDCToken.mockRejectedValue(new Error('Token verification failed'));

    await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token verification failed' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle missing Bearer prefix', async () => {
    mockRequest.headers = {
      authorization: 'some-token-without-bearer'
    };

    await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle empty token after Bearer', async () => {
    mockRequest.headers = {
      authorization: 'Bearer '
    };

    await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});