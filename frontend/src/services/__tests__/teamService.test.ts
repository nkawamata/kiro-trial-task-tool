import { teamService } from '../teamService';
import { apiClient } from '../apiClient';
import { ProjectRole } from '@task-manager/shared';

// Mock apiClient
jest.mock('../apiClient');

describe('teamService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  const mockUser = {
    id: 'user-123',
    cognitoId: 'cognito-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockMember = {
    id: 'member-123',
    projectId: 'project-123',
    userId: 'user-123',
    role: ProjectRole.MEMBER,
    joinedAt: new Date()
  };

  const mockMemberWithUser = {
    ...mockMember,
    user: mockUser
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectMembers', () => {
    it('should fetch project members successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { members: [mockMemberWithUser] }
      });

      const result = await teamService.getProjectMembers('project-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/team/projects/project-123/members');
      expect(result).toEqual([mockMemberWithUser]);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(teamService.getProjectMembers('project-123'))
        .rejects.toThrow('API Error');
    });

    it('should return empty array when no members found', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { members: [] }
      });

      const result = await teamService.getProjectMembers('project-123');

      expect(result).toEqual([]);
    });
  });

  describe('addProjectMember', () => {
    it('should add a project member successfully', async () => {
      const addMemberRequest = {
        userId: 'user-123',
        role: ProjectRole.MEMBER
      };

      mockApiClient.post.mockResolvedValue({
        data: { member: mockMember }
      });

      const result = await teamService.addProjectMember('project-123', addMemberRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/team/projects/project-123/members',
        addMemberRequest
      );
      expect(result).toEqual(mockMember);
    });

    it('should handle validation errors', async () => {
      const addMemberRequest = {
        userId: 'user-123',
        role: ProjectRole.ADMIN
      };

      mockApiClient.post.mockRejectedValue(new Error('User already exists'));

      await expect(teamService.addProjectMember('project-123', addMemberRequest))
        .rejects.toThrow('User already exists');
    });
  });

  describe('removeProjectMember', () => {
    it('should remove a project member successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await teamService.removeProjectMember('project-123', 'user-123');

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/team/projects/project-123/members/user-123'
      );
    });

    it('should handle member not found errors', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Member not found'));

      await expect(teamService.removeProjectMember('project-123', 'nonexistent'))
        .rejects.toThrow('Member not found');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      const updateRoleRequest = {
        role: ProjectRole.ADMIN
      };

      const updatedMember = {
        ...mockMember,
        role: ProjectRole.ADMIN
      };

      mockApiClient.put.mockResolvedValue({
        data: { member: updatedMember }
      });

      const result = await teamService.updateMemberRole('project-123', 'user-123', updateRoleRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/team/projects/project-123/members/user-123/role',
        updateRoleRequest
      );
      expect(result).toEqual(updatedMember);
    });

    it('should handle permission errors', async () => {
      const updateRoleRequest = {
        role: ProjectRole.ADMIN
      };

      mockApiClient.put.mockRejectedValue(new Error('Insufficient permissions'));

      await expect(teamService.updateMemberRole('project-123', 'user-123', updateRoleRequest))
        .rejects.toThrow('Insufficient permissions');
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const searchQuery = 'john';
      const mockUsers = [mockUser];

      mockApiClient.get.mockResolvedValue({
        data: { users: mockUsers }
      });

      const result = await teamService.searchUsers(searchQuery);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/team/users/search?q=john'
      );
      expect(result).toEqual(mockUsers);
    });

    it('should handle special characters in search query', async () => {
      const searchQuery = 'john@example.com';

      mockApiClient.get.mockResolvedValue({
        data: { users: [] }
      });

      await teamService.searchUsers(searchQuery);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/team/users/search?q=john%40example.com'
      );
    });

    it('should return empty array when no users found', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { users: [] }
      });

      const result = await teamService.searchUsers('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle search API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Search service unavailable'));

      await expect(teamService.searchUsers('test'))
        .rejects.toThrow('Search service unavailable');
    });

    it('should handle empty search query', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { users: [] }
      });

      const result = await teamService.searchUsers('');

      expect(mockApiClient.get).toHaveBeenCalledWith('/team/users/search?q=');
      expect(result).toEqual([]);
    });
  });
});