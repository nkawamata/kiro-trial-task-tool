import { UserService } from '../../services/userService';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const mockDynamoClient = mockClient(DynamoDBDocumentClient);

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    mockDynamoClient.reset();
    userService = new UserService();
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        cognitoId: 'cognito-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({
        Item: mockUser
      });

      const result = await userService.getUserProfile(userId);

      expect(result.id).toBe(userId);
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when user not found', async () => {
      const userId = 'non-existent-user';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({});

      await expect(userService.getUserProfile(userId)).rejects.toThrow('User not found');
    });
  });

  describe('getUserByCognitoId', () => {
    it('should find user by cognito id', async () => {
      const cognitoId = 'cognito-123';
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        cognitoId,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').ScanCommand).resolves({
        Items: [mockUser]
      });

      const result = await userService.getUserByCognitoId(cognitoId);

      expect(result).toBeTruthy();
      expect(result?.cognitoId).toBe(cognitoId);
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('should return null when user not found', async () => {
      const cognitoId = 'non-existent-cognito';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').ScanCommand).resolves({
        Items: []
      });

      const result = await userService.getUserByCognitoId(cognitoId);

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        cognitoId: 'cognito-456'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').PutCommand).resolves({});

      const result = await userService.createUser(userData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
      expect(result.cognitoId).toBe(userData.cognitoId);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle race condition and return existing user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        cognitoId: 'cognito-456'
      };

      const existingUser = {
        id: 'existing-user-123',
        ...userData,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // Mock conditional check failure
      const conditionalError = new Error('Conditional check failed');
      conditionalError.name = 'ConditionalCheckFailedException';
      
      mockDynamoClient
        .on(require('@aws-sdk/lib-dynamodb').PutCommand)
        .rejects(conditionalError)
        .on(require('@aws-sdk/lib-dynamodb').ScanCommand)
        .resolves({ Items: [existingUser] });

      const result = await userService.createUser(userData);

      expect(result.id).toBe('existing-user-123');
      expect(result.cognitoId).toBe(userData.cognitoId);
    });

    it('should throw error for other database errors', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        cognitoId: 'cognito-456'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').PutCommand).rejects(new Error('Database error'));

      await expect(userService.createUser(userData)).rejects.toThrow('Database error');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-123';
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const updatedUser = {
        id: userId,
        ...updates,
        cognitoId: 'cognito-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString()
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').UpdateCommand).resolves({
        Attributes: updatedUser
      });

      const result = await userService.updateUserProfile(userId, updates);

      expect(result.id).toBe(userId);
      expect(result.name).toBe(updates.name);
      expect(result.email).toBe(updates.email);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should update only name', async () => {
      const userId = 'user-123';
      const updates = { name: 'New Name Only' };

      const updatedUser = {
        id: userId,
        name: 'New Name Only',
        email: 'existing@example.com',
        cognitoId: 'cognito-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString()
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').UpdateCommand).resolves({
        Attributes: updatedUser
      });

      const result = await userService.updateUserProfile(userId, updates);

      expect(result.name).toBe('New Name Only');
      expect(result.email).toBe('existing@example.com');
    });
  });

  describe('getUser', () => {
    it('should get user successfully', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        cognitoId: 'cognito-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({
        Item: mockUser
      });

      const result = await userService.getUser(userId);

      expect(result).toBeTruthy();
      expect(result?.id).toBe(userId);
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent-user';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({});

      const result = await userService.getUser(userId);

      expect(result).toBeNull();
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
          cognitoId: 'cognito-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'user-2',
          name: 'Johnny Smith',
          email: 'johnny@example.com',
          cognitoId: 'cognito-2',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').ScanCommand).resolves({
        Items: mockUsers
      });

      const result = await userService.searchUsers(query);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Johnny Smith');
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should return empty array when no users found', async () => {
      const query = 'nonexistent';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').ScanCommand).resolves({
        Items: []
      });

      const result = await userService.searchUsers(query);

      expect(result).toEqual([]);
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          name: 'User 1',
          email: 'user1@example.com',
          cognitoId: 'cognito-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'user-2',
          name: 'User 2',
          email: 'user2@example.com',
          cognitoId: 'cognito-2',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').ScanCommand).resolves({
        Items: mockUsers
      });

      const result = await userService.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[1].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getOrCreateUserByCognitoId', () => {
    it('should return existing user', async () => {
      const cognitoId = 'cognito-123';
      const existingUser = {
        id: 'user-123',
        name: 'Existing User',
        email: 'existing@example.com',
        cognitoId,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').ScanCommand).resolves({
        Items: [existingUser]
      });

      const result = await userService.getOrCreateUserByCognitoId(cognitoId);

      expect(result.id).toBe('user-123');
      expect(result.name).toBe('Existing User');
    });

    it('should create new user when not found', async () => {
      const cognitoId = 'cognito-456';
      const userData = {
        email: 'new@example.com',
        name: 'New User'
      };

      mockDynamoClient
        .on(require('@aws-sdk/lib-dynamodb').ScanCommand)
        .resolves({ Items: [] })
        .on(require('@aws-sdk/lib-dynamodb').PutCommand)
        .resolves({});

      const result = await userService.getOrCreateUserByCognitoId(cognitoId, userData);

      expect(result).toHaveProperty('id');
      expect(result.cognitoId).toBe(cognitoId);
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
    });

    it('should create user with default values when userData not provided', async () => {
      const cognitoId = 'cognito-789';

      mockDynamoClient
        .on(require('@aws-sdk/lib-dynamodb').ScanCommand)
        .resolves({ Items: [] })
        .on(require('@aws-sdk/lib-dynamodb').PutCommand)
        .resolves({});

      const result = await userService.getOrCreateUserByCognitoId(cognitoId);

      expect(result.cognitoId).toBe(cognitoId);
      expect(result.email).toBe('user-cognito-@example.com');
      expect(result.name).toBe('New User');
    });
  });
});