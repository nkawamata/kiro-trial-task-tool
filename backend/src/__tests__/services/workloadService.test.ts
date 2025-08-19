import { WorkloadService } from '../../services/workloadService';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const mockDynamoClient = mockClient(DynamoDBDocumentClient);

describe('WorkloadService', () => {
  let workloadService: WorkloadService;

  beforeEach(() => {
    mockDynamoClient.reset();
    workloadService = new WorkloadService();
  });

  describe('getUserWorkload', () => {
    it('should calculate user workload correctly', async () => {
      const userId = 'user-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockTasks = [
        {
          id: 'task-1',
          assigneeId: userId,
          startDate: '2024-01-05',
          endDate: '2024-01-10',
          estimatedHours: 40,
          status: 'in-progress'
        },
        {
          id: 'task-2',
          assigneeId: userId,
          startDate: '2024-01-15',
          endDate: '2024-01-20',
          estimatedHours: 20,
          status: 'todo'
        }
      ];

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').QueryCommand).resolves({
        Items: mockTasks
      });

      const result = await workloadService.getUserWorkload(userId, startDate, endDate);

      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('totalHours', 60);
      expect(result).toHaveProperty('tasks');
      expect(result.tasks).toHaveLength(2);
    });

    it('should handle empty workload', async () => {
      const userId = 'user-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').QueryCommand).resolves({
        Items: []
      });

      const result = await workloadService.getUserWorkload(userId, startDate, endDate);

      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('totalHours', 0);
      expect(result.tasks).toHaveLength(0);
    });
  });

  describe('getTeamWorkload', () => {
    it('should calculate team workload correctly', async () => {
      const teamId = 'team-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockTeam = {
        id: teamId,
        name: 'Test Team',
        members: ['user-1', 'user-2']
      };

      const mockTasks = [
        {
          id: 'task-1',
          assigneeId: 'user-1',
          startDate: '2024-01-05',
          endDate: '2024-01-10',
          estimatedHours: 40,
          status: 'in-progress'
        },
        {
          id: 'task-2',
          assigneeId: 'user-2',
          startDate: '2024-01-15',
          endDate: '2024-01-20',
          estimatedHours: 30,
          status: 'todo'
        }
      ];

      mockDynamoClient
        .on(require('@aws-sdk/lib-dynamodb').GetCommand)
        .resolves({ Item: mockTeam })
        .on(require('@aws-sdk/lib-dynamodb').QueryCommand)
        .resolves({ Items: mockTasks });

      const result = await workloadService.getTeamWorkload(teamId, startDate, endDate);

      expect(result).toHaveProperty('teamId', teamId);
      expect(result).toHaveProperty('totalHours', 70);
      expect(result).toHaveProperty('memberWorkloads');
      expect(result.memberWorkloads).toHaveLength(2);
    });
  });

  describe('getProjectWorkload', () => {
    it('should calculate project workload correctly', async () => {
      const projectId = 'project-123';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockTasks = [
        {
          id: 'task-1',
          projectId,
          assigneeId: 'user-1',
          startDate: '2024-01-05',
          endDate: '2024-01-10',
          estimatedHours: 40,
          status: 'in-progress'
        },
        {
          id: 'task-2',
          projectId,
          assigneeId: 'user-2',
          startDate: '2024-01-15',
          endDate: '2024-01-20',
          estimatedHours: 30,
          status: 'todo'
        }
      ];

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').QueryCommand).resolves({
        Items: mockTasks
      });

      const result = await workloadService.getProjectWorkload(projectId, startDate, endDate);

      expect(result).toHaveProperty('projectId', projectId);
      expect(result).toHaveProperty('totalHours', 70);
      expect(result).toHaveProperty('tasks');
      expect(result.tasks).toHaveLength(2);
    });
  });

  describe('updateTaskAllocation', () => {
    it('should update task allocation successfully', async () => {
      const taskId = 'task-123';
      const allocation = {
        assigneeId: 'user-456',
        estimatedHours: 25,
        startDate: '2024-01-10',
        endDate: '2024-01-15'
      };

      const updatedTask = {
        id: taskId,
        ...allocation,
        updatedAt: new Date().toISOString()
      };

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').UpdateCommand).resolves({
        Attributes: updatedTask
      });

      const result = await workloadService.updateTaskAllocation(taskId, allocation);

      expect(result).toEqual(updatedTask);
    });
  });

  describe('getWorkloadSummary', () => {
    it('should generate workload summary correctly', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockTasks = [
        {
          id: 'task-1',
          assigneeId: 'user-1',
          projectId: 'project-1',
          estimatedHours: 40,
          status: 'in-progress'
        },
        {
          id: 'task-2',
          assigneeId: 'user-2',
          projectId: 'project-1',
          estimatedHours: 30,
          status: 'todo'
        }
      ];

      mockDynamoClient.on(require('@aws-sdk/lib-dynamodb').ScanCommand).resolves({
        Items: mockTasks
      });

      const result = await workloadService.getWorkloadSummary(startDate, endDate);

      expect(result).toHaveProperty('totalHours', 70);
      expect(result).toHaveProperty('userSummaries');
      expect(result).toHaveProperty('projectSummaries');
    });
  });
});