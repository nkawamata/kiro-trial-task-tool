import { TeamsService } from '../../services/teamsService';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const mockDynamoClient = mockClient(DynamoDBDocumentClient);

// Mock UserService
jest.mock('../../services/userService', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    getUserProfile: jest.fn().mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User'
    })
  }))
}));

describe('TeamsService', () => {
  let teamsService: TeamsService;

  beforeEach(() => {
    mockDynamoClient.reset();
    teamsService = new TeamsService();
  });

  describe('createTeam', () => {
    it('should create a team successfully', async () => {
      const name = 'Test Team';
      const description = 'A test team';
      const ownerId = 'user1';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').PutCommand).resolves({});

      const result = await teamsService.createTeam(name, description, ownerId);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
      expect(result.ownerId).toBe(ownerId);
      expect(result.createdAt).toBeDefined();
    });

    it('should throw error when team creation fails', async () => {
      const name = 'Test Team';
      const description = 'A test team';
      const ownerId = 'user1';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').PutCommand).rejects(new Error('DynamoDB error'));

      await expect(teamsService.createTeam(name, description, ownerId)).rejects.toThrow();
    });
  });

  describe('getTeam', () => {
    it('should retrieve a team by id', async () => {
      const teamId = 'team-123';
      const mockTeam = {
        id: teamId,
        name: 'Test Team',
        description: 'A test team',
        ownerId: 'user1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({
        Item: mockTeam
      });

      const result = await teamsService.getTeam(teamId);

      expect(result).toBeTruthy();
      expect(result?.id).toBe(teamId);
      expect(result?.name).toBe('Test Team');
    });

    it('should return null when team not found', async () => {
      const teamId = 'non-existent-team';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({});

      const result = await teamsService.getTeam(teamId);

      expect(result).toBeNull();
    });
  });

  describe('getUserTeams', () => {
    it('should retrieve user teams', async () => {
      const userId = 'user-123';
      const mockMemberships = [
        {
          id: 'member-1',
          teamId: 'team-1',
          userId,
          role: 'member',
          joinedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const mockTeam = {
        id: 'team-1',
        name: 'Test Team',
        description: 'A test team',
        ownerId: 'user1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockDynamoClient
        .on(require('@aws-sdk/lib-dynamodb').QueryCommand)
        .resolves({ Items: mockMemberships })
        .on(require('@aws-sdk/lib-dynamodb').GetCommand)
        .resolves({ Item: mockTeam });

      const result = await teamsService.getUserTeams(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('team-1');
      expect(result[0].role).toBe('member');
    });
  });
});