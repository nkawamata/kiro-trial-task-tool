import { authService } from '../authService';
import { apiClient } from '../apiClient';

// Mock the apiClient
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          cognitoId: 'cognito-123'
        },
        tokenInfo: {
          sub: 'cognito-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await authService.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });

    it('should handle API error', async () => {
      const errorMessage = 'Unauthorized';
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(authService.getCurrentUser()).rejects.toThrow(errorMessage);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        cognitoId: 'cognito-123'
      };

      mockApiClient.post.mockResolvedValue({ data: { user: mockUser } });

      const result = await authService.createUser();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/create-user');
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('syncUser', () => {
    it('should sync user data successfully', async () => {
      const userData = {
        cognitoId: 'cognito-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockUser = {
        id: 'user-123',
        ...userData
      };

      mockApiClient.post.mockResolvedValue({ data: { user: mockUser } });

      const result = await authService.syncUser(userData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/sync-user', userData);
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('extractUserInfo', () => {
    it('should extract user info from OIDC user', () => {
      const oidcUser = {
        sub: 'cognito-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const result = authService.extractUserInfo(oidcUser);

      expect(result).toEqual({
        cognitoId: 'cognito-123',
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should handle missing email with fallback', () => {
      const oidcUser = {
        sub: 'cognito-123',
        name: 'Test User'
      };

      const result = authService.extractUserInfo(oidcUser);

      expect(result.email).toBe('user-cognito-@example.com');
    });

    it('should construct name from given_name and family_name', () => {
      const oidcUser = {
        sub: 'cognito-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe'
      };

      const result = authService.extractUserInfo(oidcUser);

      expect(result.name).toBe('John Doe');
    });

    it('should use preferred_username as fallback', () => {
      const oidcUser = {
        sub: 'cognito-123',
        email: 'test@example.com',
        preferred_username: 'johndoe'
      };

      const result = authService.extractUserInfo(oidcUser);

      expect(result.name).toBe('johndoe');
    });

    it('should use default name when all else fails', () => {
      const oidcUser = {
        sub: 'cognito-123',
        email: 'test@example.com'
      };

      const result = authService.extractUserInfo(oidcUser);

      expect(result.name).toBe('New User');
    });
  });

  describe('handleUserLogin', () => {
    it('should handle successful login with existing user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        cognitoId: 'cognito-123'
      };

      const mockResponse = {
        user: mockUser,
        tokenInfo: { sub: 'cognito-123' }
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await authService.handleUserLogin({ sub: 'cognito-123' });

      expect(result).toEqual(mockUser);
    });

    it('should handle auto-creation disabled scenario', async () => {
      const mockResponse = {
        user: null,
        tokenInfo: { sub: 'cognito-123' },
        message: 'Auto-creation may be disabled'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        cognitoId: 'cognito-123'
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });
      mockApiClient.post.mockResolvedValue({ data: { user: mockUser } });

      const result = await authService.handleUserLogin({ sub: 'cognito-123' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/create-user');
      expect(result).toEqual(mockUser);
    });

    it('should handle error with sync fallback', async () => {
      const oidcUser = {
        sub: 'cognito-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockUser = {
        id: 'user-123',
        ...oidcUser,
        cognitoId: oidcUser.sub
      };

      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      mockApiClient.post.mockResolvedValue({ data: { user: mockUser } });

      const result = await authService.handleUserLogin(oidcUser);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/sync-user', {
        cognitoId: 'cognito-123',
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when all methods fail', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      mockApiClient.post.mockRejectedValue(new Error('Sync error'));

      const result = await authService.handleUserLogin({ sub: 'cognito-123' });

      expect(result).toBeNull();
    });
  });

  describe('extractUserInfoFromAny', () => {
    it('should extract info from nested profile', () => {
      const oidcUser = {
        profile: {
          sub: 'cognito-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      const result = authService.extractUserInfoFromAny(oidcUser);

      expect(result).toEqual({
        cognitoId: 'cognito-123',
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should handle mixed structure', () => {
      const oidcUser = {
        sub: 'cognito-123',
        profile: {
          email: 'test@example.com'
        },
        given_name: 'John',
        family_name: 'Doe'
      };

      const result = authService.extractUserInfoFromAny(oidcUser);

      expect(result).toEqual({
        cognitoId: 'cognito-123',
        email: 'test@example.com',
        name: 'John Doe'
      });
    });
  });
});