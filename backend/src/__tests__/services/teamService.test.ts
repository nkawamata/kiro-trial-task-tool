import { TeamService } from '../../services/teamService';
import { UserService } from '../../services/userService';
import { ProjectMember, ProjectRole, User } from '../../../../shared/src/types';

// Mock dependencies
jest.mock('../../services/userService');
jest.mock('../../config/dynamodb', () => ({
  dynamoDb: {
    send: jest.fn()
  },
  TABLES: {
    PROJECT_MEMBERS: 'project-members-table',
    PROJECTS: 'projects-table'
  }
}));

const { dynamoDb, TABLES } = require('../../config/dynamodb');

describe('TeamService', () => {
  let teamService: TeamService;
  let mockUserService: jest.Mocked<UserService>;
  let mockDynamoDb: { send: jest.MockedFunction<any> };

  const mockUser: User = {
    id: 'user-123',
    cognitoId: 'cognito-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockMember: ProjectMember = {
    id: 'member-123',
    projectId: 'project-123',
    userId: 'user-123',
    role: ProjectRole.MEMBER,
    joinedAt: new Date('2024-01-01T00:00:00Z')
  };

  const mockDbMember = {
    ...mockMember,
    joinedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    teamService = new TeamService();
    mockUserService = (teamService as any).userService;
    mockDynamoDb = dynamoDb;
  });

  describe('addProjectMember', () => {
    it('should add a new project member', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Items: [] }) // getProjectMember check
        .mockResolvedValueOnce({}); // addProjectMember
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      const result = await teamService.addProjectMember('project-123', 'user-123', ProjectRole.MEMBER, 'admin-123');

      expect(mockUserService.getUserProfile).toHaveBeenCalledWith('user-123');
      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.PROJECT_MEMBERS,
            Item: expect.objectContaining({
              projectId: 'project-123',
              userId: 'user-123',
              role: ProjectRole.MEMBER
            })
          })
        })
      );
      expect(result.projectId).toBe('project-123');
      expect(result.userId).toBe('user-123');
      expect(result.role).toBe(ProjectRole.MEMBER);
    });

    it('should throw error when user is already a member', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [mockDbMember] });

      await expect(
        teamService.addProjectMember('project-123', 'user-123', ProjectRole.MEMBER, 'admin-123')
      ).rejects.toThrow('User is already a member of this project');
    });

    it('should throw error when user does not exist', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });
      mockUserService.getUserProfile.mockRejectedValue(new Error('User not found'));

      await expect(
        teamService.addProjectMember('project-123', 'nonexistent', ProjectRole.MEMBER, 'admin-123')
      ).rejects.toThrow('User not found');
    });
  });

  describe('removeProjectMember', () => {
    it('should remove a project member', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Items: [mockDbMember] }) // getProjectMember
        .mockResolvedValueOnce({}); // removeProjectMember

      await teamService.removeProjectMember('project-123', 'user-123', 'admin-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.PROJECT_MEMBERS,
            Key: { id: 'member-123' }
          })
        })
      );
    });

    it('should throw error when user is not a member', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      await expect(
        teamService.removeProjectMember('project-123', 'user-123', 'admin-123')
      ).rejects.toThrow('User is not a member of this project');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Items: [mockDbMember] }) // getProjectMember
        .mockResolvedValueOnce({}); // updateMemberRole

      const result = await teamService.updateMemberRole('project-123', 'user-123', ProjectRole.ADMIN, 'owner-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.PROJECT_MEMBERS,
            Item: expect.objectContaining({
              role: ProjectRole.ADMIN
            })
          })
        })
      );
      expect(result.role).toBe(ProjectRole.ADMIN);
    });

    it('should throw error when user is not a member', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      await expect(
        teamService.updateMemberRole('project-123', 'user-123', ProjectRole.ADMIN, 'owner-123')
      ).rejects.toThrow('User is not a member of this project');
    });
  });

  describe('getProjectMembers', () => {
    it('should return project members with user details', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [mockDbMember] });
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      const result = await teamService.getProjectMembers('project-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.PROJECT_MEMBERS,
            IndexName: 'ProjectIdIndex',
            KeyConditionExpression: 'projectId = :projectId'
          })
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockMember,
        user: mockUser
      });
    });

    it('should filter out members with missing users', async () => {
      const member1 = { ...mockDbMember, id: 'member-1', userId: 'user-1' };
      const member2 = { ...mockDbMember, id: 'member-2', userId: 'user-2' };
      
      mockDynamoDb.send.mockResolvedValue({ Items: [member1, member2] });
      mockUserService.getUserProfile
        .mockResolvedValueOnce(mockUser) // user-1 found
        .mockRejectedValueOnce(new Error('User not found')); // user-2 not found

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await teamService.getProjectMembers('project-123');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('User not found for member member-2')
      );

      consoleSpy.mockRestore();
    });

    it('should return empty array when no members found', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      const result = await teamService.getProjectMembers('project-123');

      expect(result).toEqual([]);
    });
  });

  describe('getProjectMember', () => {
    it('should return project member when found', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [mockDbMember] });

      const result = await teamService.getProjectMember('project-123', 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.PROJECT_MEMBERS,
            FilterExpression: 'projectId = :projectId AND userId = :userId',
            ExpressionAttributeValues: {
              ':projectId': 'project-123',
              ':userId': 'user-123'
            }
          })
        })
      );
      expect(result).toEqual(mockMember);
    });

    it('should return null when member not found', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      const result = await teamService.getProjectMember('project-123', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('getUserProjectRole', () => {
    it('should return user role when member exists', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [mockDbMember] });

      const result = await teamService.getUserProjectRole('project-123', 'user-123');

      expect(result).toBe(ProjectRole.MEMBER);
    });

    it('should return null when user is not a member', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      const result = await teamService.getUserProjectRole('project-123', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('canUserManageTeam', () => {
    it('should return true when user is project owner', async () => {
      mockDynamoDb.send.mockResolvedValue({
        Item: { id: 'project-123', ownerId: 'user-123' }
      });

      const result = await teamService.canUserManageTeam('project-123', 'user-123');

      expect(result).toBe(true);
    });

    it('should return true when user has admin role', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: { id: 'project-123', ownerId: 'other-user' } }) // project check
        .mockResolvedValueOnce({ Items: [{ ...mockDbMember, role: ProjectRole.ADMIN }] }); // role check

      const result = await teamService.canUserManageTeam('project-123', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false when user has member role', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: { id: 'project-123', ownerId: 'other-user' } })
        .mockResolvedValueOnce({ Items: [mockDbMember] }); // MEMBER role

      const result = await teamService.canUserManageTeam('project-123', 'user-123');

      expect(result).toBe(false);
    });

    it('should return false when user is not a member', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: { id: 'project-123', ownerId: 'other-user' } })
        .mockResolvedValueOnce({ Items: [] });

      const result = await teamService.canUserManageTeam('project-123', 'user-123');

      expect(result).toBe(false);
    });
  });
});