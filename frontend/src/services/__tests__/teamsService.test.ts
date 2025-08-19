import { teamsService } from '../teamsService';
import { apiClient } from '../apiClient';

// Mock the API client
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('teamsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserTeams', () => {
    it('should fetch user teams successfully', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          name: 'Development Team',
          description: 'Frontend and backend developers',
          members: ['user-1', 'user-2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          role: 'ADMIN'
        },
        {
          id: 'team-2',
          name: 'Design Team',
          description: 'UI/UX designers',
          members: ['user-3'],
          createdAt: '2024-01-02T00:00:00.000Z',
          role: 'MEMBER'
        }
      ];

      mockApiClient.get.mockResolvedValue({ data: { teams: mockTeams } });

      const result = await teamsService.getUserTeams();

      expect(mockApiClient.get).toHaveBeenCalledWith('/teams/my-teams');
      expect(result).toEqual(mockTeams);
    });

    it('should handle API error', async () => {
      const errorMessage = 'Network error';
      mockApiClient.get.mockRejectedValue(new Error(errorMessage));

      await expect(teamsService.getUserTeams()).rejects.toThrow(errorMessage);
    });
  });

  describe('getTeam', () => {
    it('should fetch team by id successfully', async () => {
      const teamId = 'team-123';
      const mockTeam = {
        id: teamId,
        name: 'Test Team',
        description: 'A test team',
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };
      const mockUserRole = 'ADMIN';

      mockApiClient.get.mockResolvedValue({ 
        data: { 
          team: mockTeam, 
          userRole: mockUserRole 
        } 
      });

      const result = await teamsService.getTeam(teamId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/teams/${teamId}`);
      expect(result).toEqual({ team: mockTeam, userRole: mockUserRole });
    });
  });

  describe('createTeam', () => {
    it('should create team successfully', async () => {
      const teamData = {
        name: 'New Team',
        description: 'A new team'
      };

      const mockCreatedTeam = {
        id: 'team-new',
        name: 'New Team',
        description: 'A new team',
        members: ['user-1', 'user-2'],
        createdAt: '2024-01-03T00:00:00.000Z'
      };

      mockApiClient.post.mockResolvedValue({ data: { team: mockCreatedTeam } });

      const result = await teamsService.createTeam(teamData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/teams', teamData);
      expect(result).toEqual(mockCreatedTeam);
    });

    it('should handle validation error', async () => {
      const teamData = {
        name: '',
        description: 'A team without name'
      };

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Team name is required' }
        }
      };

      mockApiClient.post.mockRejectedValue(errorResponse);

      await expect(teamsService.createTeam(teamData)).rejects.toEqual(errorResponse);
    });
  });

  describe('updateTeam', () => {
    it('should update team successfully', async () => {
      const teamId = 'team-123';
      const updates = {
        name: 'Updated Team Name',
        description: 'Updated description'
      };

      const mockUpdatedTeam = {
        id: teamId,
        name: 'Updated Team Name',
        description: 'Updated description',
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z'
      };

      mockApiClient.put.mockResolvedValue({ data: { team: mockUpdatedTeam } });

      const result = await teamsService.updateTeam(teamId, updates);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/teams/${teamId}`, updates);
      expect(result).toEqual(mockUpdatedTeam);
    });
  });

  describe('deleteTeam', () => {
    it('should delete team successfully', async () => {
      const teamId = 'team-123';

      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await teamsService.deleteTeam(teamId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/teams/${teamId}`);
    });

    it('should handle delete error', async () => {
      const teamId = 'team-123';
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Team not found' }
        }
      };

      mockApiClient.delete.mockRejectedValue(errorResponse);

      await expect(teamsService.deleteTeam(teamId)).rejects.toEqual(errorResponse);
    });
  });

  describe('addTeamMember', () => {
    it('should add member to team successfully', async () => {
      const teamId = 'team-123';
      const memberData = { userId: 'user-456', role: 'MEMBER' as const };

      const mockMember = {
        id: 'member-123',
        teamId,
        userId: 'user-456',
        role: 'MEMBER',
        joinedAt: '2024-01-04T00:00:00.000Z'
      };

      mockApiClient.post.mockResolvedValue({ data: { member: mockMember } });

      const result = await teamsService.addTeamMember(teamId, memberData);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/teams/${teamId}/members`, memberData);
      expect(result).toEqual(mockMember);
    });
  });

  describe('removeTeamMember', () => {
    it('should remove member from team successfully', async () => {
      const teamId = 'team-123';
      const userId = 'user-456';

      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await teamsService.removeTeamMember(teamId, userId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/teams/${teamId}/members/${userId}`);
    });
  });

  describe('getProjectTeams', () => {
    it('should fetch project teams successfully', async () => {
      const projectId = 'project-123';
      const mockProjectTeams = [
        {
          id: 'pt-1',
          projectId,
          teamId: 'team-1',
          team: {
            id: 'team-1',
            name: 'Development Team',
            description: 'Frontend and backend developers'
          },
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'pt-2',
          projectId,
          teamId: 'team-2',
          team: {
            id: 'team-2',
            name: 'Design Team',
            description: 'UI/UX designers'
          },
          createdAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      mockApiClient.get.mockResolvedValue({ data: { projectTeams: mockProjectTeams } });

      const result = await teamsService.getProjectTeams(projectId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/projects/${projectId}/teams`);
      expect(result).toEqual(mockProjectTeams);
    });
  });
});