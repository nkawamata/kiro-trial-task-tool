import request from 'supertest';
import express from 'express';
import teamsRouter from '../../routes/teams';
import { TeamsService } from '../../services/teamsService';

// Mock the teams service
jest.mock('../../services/teamsService');
const MockTeamsService = TeamsService as jest.MockedClass<typeof TeamsService>;

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { sub: 'test-user-id', email: 'test@example.com' };
    next();
  }
}));

describe('Teams Routes', () => {
  let app: express.Application;
  let mockTeamsService: jest.Mocked<TeamsService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/teams', teamsRouter);

    mockTeamsService = new MockTeamsService() as jest.Mocked<TeamsService>;
    MockTeamsService.mockImplementation(() => mockTeamsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /teams', () => {
    it('should return all teams', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          name: 'Development Team',
          description: 'Frontend and backend developers',
          members: ['user-1', 'user-2'],
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'team-2',
          name: 'Design Team',
          description: 'UI/UX designers',
          members: ['user-3'],
          createdAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      mockTeamsService.getAllTeams.mockResolvedValue(mockTeams);

      const response = await request(app)
        .get('/teams')
        .expect(200);

      expect(response.body).toEqual(mockTeams);
      expect(mockTeamsService.getAllTeams).toHaveBeenCalled();
    });

    it('should handle service error', async () => {
      mockTeamsService.getAllTeams.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/teams')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /teams/:id', () => {
    it('should return team by id', async () => {
      const mockTeam = {
        id: 'team-1',
        name: 'Development Team',
        description: 'Frontend and backend developers',
        members: ['user-1', 'user-2'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      mockTeamsService.getTeam.mockResolvedValue(mockTeam);

      const response = await request(app)
        .get('/teams/team-1')
        .expect(200);

      expect(response.body).toEqual(mockTeam);
      expect(mockTeamsService.getTeam).toHaveBeenCalledWith('team-1');
    });

    it('should return 404 when team not found', async () => {
      mockTeamsService.getTeam.mockResolvedValue(null);

      const response = await request(app)
        .get('/teams/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Team not found');
    });
  });

  describe('POST /teams', () => {
    it('should create new team', async () => {
      const teamData = {
        name: 'New Team',
        description: 'A new team',
        members: ['user-1', 'user-2']
      };

      const mockCreatedTeam = {
        id: 'team-new',
        ...teamData,
        createdAt: '2024-01-03T00:00:00.000Z'
      };

      mockTeamsService.createTeam.mockResolvedValue(mockCreatedTeam);

      const response = await request(app)
        .post('/teams')
        .send(teamData)
        .expect(201);

      expect(response.body).toEqual(mockCreatedTeam);
      expect(mockTeamsService.createTeam).toHaveBeenCalledWith(teamData);
    });

    it('should validate required fields', async () => {
      const invalidTeamData = {
        description: 'A team without name'
      };

      const response = await request(app)
        .post('/teams')
        .send(invalidTeamData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle service error', async () => {
      const teamData = {
        name: 'New Team',
        description: 'A new team',
        members: []
      };

      mockTeamsService.createTeam.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/teams')
        .send(teamData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /teams/:id', () => {
    it('should update team', async () => {
      const teamId = 'team-1';
      const updates = {
        name: 'Updated Team Name',
        description: 'Updated description'
      };

      const mockUpdatedTeam = {
        id: teamId,
        ...updates,
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z'
      };

      mockTeamsService.updateTeam.mockResolvedValue(mockUpdatedTeam);

      const response = await request(app)
        .put(`/teams/${teamId}`)
        .send(updates)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedTeam);
      expect(mockTeamsService.updateTeam).toHaveBeenCalledWith(teamId, updates);
    });

    it('should return 404 when team not found', async () => {
      mockTeamsService.updateTeam.mockResolvedValue(null);

      const response = await request(app)
        .put('/teams/non-existent')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Team not found');
    });
  });

  describe('DELETE /teams/:id', () => {
    it('should delete team', async () => {
      const teamId = 'team-1';

      mockTeamsService.deleteTeam.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/teams/${teamId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Team deleted successfully');
      expect(mockTeamsService.deleteTeam).toHaveBeenCalledWith(teamId);
    });

    it('should handle service error', async () => {
      mockTeamsService.deleteTeam.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/teams/team-1')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /teams/:id/members', () => {
    it('should add member to team', async () => {
      const teamId = 'team-1';
      const userId = 'user-456';

      const mockUpdatedTeam = {
        id: teamId,
        name: 'Test Team',
        members: ['user-1', 'user-2', userId],
        updatedAt: '2024-01-04T00:00:00.000Z'
      };

      mockTeamsService.addMemberToTeam.mockResolvedValue(mockUpdatedTeam);

      const response = await request(app)
        .post(`/teams/${teamId}/members`)
        .send({ userId })
        .expect(200);

      expect(response.body).toEqual(mockUpdatedTeam);
      expect(mockTeamsService.addMemberToTeam).toHaveBeenCalledWith(teamId, userId);
    });

    it('should validate userId', async () => {
      const response = await request(app)
        .post('/teams/team-1/members')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /teams/:id/members/:userId', () => {
    it('should remove member from team', async () => {
      const teamId = 'team-1';
      const userId = 'user-456';

      const mockUpdatedTeam = {
        id: teamId,
        name: 'Test Team',
        members: ['user-1'],
        updatedAt: '2024-01-04T00:00:00.000Z'
      };

      mockTeamsService.removeMemberFromTeam.mockResolvedValue(mockUpdatedTeam);

      const response = await request(app)
        .delete(`/teams/${teamId}/members/${userId}`)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedTeam);
      expect(mockTeamsService.removeMemberFromTeam).toHaveBeenCalledWith(teamId, userId);
    });

    it('should handle service error', async () => {
      mockTeamsService.removeMemberFromTeam.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/teams/team-1/members/user-1')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});