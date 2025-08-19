import { ProjectService } from '../../services/projectService';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const mockDynamoClient = mockClient(DynamoDBDocumentClient);

describe('ProjectService', () => {
  let projectService: ProjectService;

  beforeEach(() => {
    mockDynamoClient.reset();
    projectService = new ProjectService();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        ownerId: 'user-123'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').PutCommand).resolves({});

      const result = await projectService.createProject(projectData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(projectData.name);
      expect(result.description).toBe(projectData.description);
      expect(result.ownerId).toBe(projectData.ownerId);
      expect(result.createdAt).toBeDefined();
    });

    it('should throw error when project creation fails', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        ownerId: 'user-123'
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').PutCommand).rejects(new Error('DynamoDB error'));

      await expect(projectService.createProject(projectData)).rejects.toThrow('Failed to create project');
    });
  });

  describe('getProject', () => {
    it('should retrieve a project by id', async () => {
      const projectId = 'project-123';
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        description: 'A test project',
        ownerId: 'user-123',
        createdAt: new Date().toISOString()
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({
        Item: mockProject
      });

      const result = await projectService.getProject(projectId);

      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      const projectId = 'non-existent-project';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').GetCommand).resolves({});

      const result = await projectService.getProject(projectId);

      expect(result).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const projectId = 'project-123';
      const updates = {
        name: 'Updated Project Name',
        description: 'Updated description'
      };

      const updatedProject = {
        id: projectId,
        ...updates,
        ownerId: 'user-123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString()
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').UpdateCommand).resolves({
        Attributes: updatedProject
      });

      const result = await projectService.updateProject(projectId, updates);

      expect(result).toEqual(updatedProject);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const projectId = 'project-123';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').DeleteCommand).resolves({});

      await expect(projectService.deleteProject(projectId)).resolves.not.toThrow();
    });
  });

  describe('getUserProjects', () => {
    it('should retrieve user projects', async () => {
      const userId = 'user-123';
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          ownerId: userId,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'project-2',
          name: 'Project 2',
          ownerId: userId,
          createdAt: '2023-01-02T00:00:00.000Z'
        }
      ];

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').QueryCommand).resolves({
        Items: mockProjects
      });

      const result = await projectService.getUserProjects(userId);

      expect(result).toEqual(mockProjects);
    });
  });

  describe('assignTeamToProject', () => {
    it('should assign team to project successfully', async () => {
      const projectId = 'project-123';
      const teamId = 'team-456';

      const updatedProject = {
        id: projectId,
        name: 'Test Project',
        teamId,
        updatedAt: new Date().toISOString()
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').UpdateCommand).resolves({
        Attributes: updatedProject
      });

      const result = await projectService.assignTeamToProject(projectId, teamId);

      expect(result).toEqual(updatedProject);
    });
  });
});