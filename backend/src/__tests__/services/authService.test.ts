import { AuthService } from '../../services/authService';
import { UserService } from '../../services/userService';
import { User } from '../../../../shared/src/types';

// Mock UserService
jest.mock('../../services/userService');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<UserService>;

  const mockUser: User = {
    id: 'user-123',
    cognitoId: 'cognito-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUserData = {
    cognitoId: 'cognito-123',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockUserService = (authService as any).userService;
  });

  describe('syncUser', () => {
    it('should return existing user when user already exists', async () => {
      mockUserService.getUserByCognitoId.mockResolvedValue(mockUser);

      const result = await authService.syncUser(mockUserData);

      expect(mockUserService.getUserByCognitoId).toHaveBeenCalledWith('cognito-123');
      expect(result).toEqual(mockUser);
      expect(mockUserService.updateUserProfile).not.toHaveBeenCalled();
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('should update existing user when email or name has changed', async () => {
      const existingUser = { ...mockUser, email: 'old@example.com', name: 'Old Name' };
      const updatedUser = { ...mockUser, email: 'test@example.com', name: 'Test User' };

      mockUserService.getUserByCognitoId.mockResolvedValue(existingUser);
      mockUserService.updateUserProfile.mockResolvedValue(updatedUser);

      const result = await authService.syncUser(mockUserData);

      expect(mockUserService.getUserByCognitoId).toHaveBeenCalledWith('cognito-123');
      expect(mockUserService.updateUserProfile).toHaveBeenCalledWith('user-123', {
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(result).toEqual(updatedUser);
    });

    it('should create new user when user does not exist', async () => {
      mockUserService.getUserByCognitoId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);

      const result = await authService.syncUser(mockUserData);

      expect(mockUserService.getUserByCognitoId).toHaveBeenCalledWith('cognito-123');
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        cognitoId: 'cognito-123',
        email: 'test@example.com',
        name: 'Test User'
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle errors during user creation', async () => {
      mockUserService.getUserByCognitoId.mockResolvedValue(null);
      mockUserService.createUser.mockRejectedValue(new Error('Database error'));

      await expect(authService.syncUser(mockUserData)).rejects.toThrow('Database error');
    });

    it('should handle errors during user update', async () => {
      const existingUser = { ...mockUser, email: 'old@example.com' };
      mockUserService.getUserByCognitoId.mockResolvedValue(existingUser);
      mockUserService.updateUserProfile.mockRejectedValue(new Error('Update failed'));

      await expect(authService.syncUser(mockUserData)).rejects.toThrow('Update failed');
    });
  });

  describe('getOrCreateUser', () => {
    it('should call syncUser with the provided user data', async () => {
      mockUserService.getUserByCognitoId.mockResolvedValue(mockUser);

      const result = await authService.getOrCreateUser(mockUserData);

      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserFromToken', () => {
    it('should return user when found by cognito ID', async () => {
      mockUserService.getUserByCognitoId.mockResolvedValue(mockUser);

      const result = await authService.getUserFromToken('cognito-123');

      expect(mockUserService.getUserByCognitoId).toHaveBeenCalledWith('cognito-123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserService.getUserByCognitoId.mockResolvedValue(null);

      const result = await authService.getUserFromToken('nonexistent-id');

      expect(mockUserService.getUserByCognitoId).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should handle errors from user service', async () => {
      mockUserService.getUserByCognitoId.mockRejectedValue(new Error('Database error'));

      await expect(authService.getUserFromToken('cognito-123')).rejects.toThrow('Database error');
    });
  });
});