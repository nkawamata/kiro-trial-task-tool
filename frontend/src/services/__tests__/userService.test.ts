import { userService } from '../userService';
import { apiClient } from '../apiClient';

// Mock the apiClient
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        cognitoId: 'cognito-123'
      };

      mockApiClient.get.mockResolvedValue({ 
        data: { user: mockUser } 
      });

      const result = await userService.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });

    it('should handle API error', async () => {
      const errorMessage = 'Unauthorized';
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(userService.getCurrentUser()).rejects.toThrow(errorMessage);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const mockUpdatedUser = {
        id: 'user-123',
        ...updates,
        cognitoId: 'cognito-123'
      };

      mockApiClient.put.mockResolvedValue({ 
        data: { user: mockUpdatedUser } 
      });

      const result = await userService.updateProfile(updates);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me', updates);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle validation error', async () => {
      const updates = {
        name: '',
        email: 'invalid-email'
      };

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid profile data' }
        }
      };

      mockApiClient.put.mockRejectedValue(errorResponse);

      await expect(userService.updateProfile(updates)).rejects.toEqual(errorResponse);
    });

    it('should handle partial updates', async () => {
      const updates = {
        name: 'New Name Only'
      };

      const mockUpdatedUser = {
        id: 'user-123',
        name: 'New Name Only',
        email: 'existing@example.com',
        cognitoId: 'cognito-123'
      };

      mockApiClient.put.mockResolvedValue({ 
        data: { user: mockUpdatedUser } 
      });

      const result = await userService.updateProfile(updates);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me', updates);
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const query = 'john';
      const mockUsers = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          cognitoId: 'cognito-1'
        },
        {
          id: 'user-2',
          name: 'Johnny Smith',
          email: 'johnny@example.com',
          cognitoId: 'cognito-2'
        }
      ];

      mockApiClient.get.mockResolvedValue({ 
        data: { users: mockUsers } 
      });

      const result = await userService.searchUsers(query);

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/search?q=john');
      expect(result).toEqual(mockUsers);
    });

    it('should handle empty search results', async () => {
      const query = 'nonexistent';

      mockApiClient.get.mockResolvedValue({ 
        data: { users: [] } 
      });

      const result = await userService.searchUsers(query);

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/search?q=nonexistent');
      expect(result).toEqual([]);
    });

    it('should encode special characters in query', async () => {
      const query = 'user@domain.com';

      mockApiClient.get.mockResolvedValue({ 
        data: { users: [] } 
      });

      await userService.searchUsers(query);

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/search?q=user%40domain.com');
    });

    it('should handle search error', async () => {
      const query = 'test';
      const errorMessage = 'Search failed';
      
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(userService.searchUsers(query)).rejects.toThrow(errorMessage);
    });
  });

  describe('getUser', () => {
    it('should fetch user by id successfully', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        cognitoId: 'cognito-123'
      };

      mockApiClient.get.mockResolvedValue({ 
        data: { user: mockUser } 
      });

      const result = await userService.getUser(userId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/users/${userId}`);
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      const userId = 'non-existent-user';
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      };

      mockApiClient.get.mockRejectedValue(errorResponse);

      await expect(userService.getUser(userId)).rejects.toEqual(errorResponse);
    });

    it('should handle network error', async () => {
      const userId = 'user-123';
      const errorMessage = 'Network error';
      
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(userService.getUser(userId)).rejects.toThrow(errorMessage);
    });
  });
});