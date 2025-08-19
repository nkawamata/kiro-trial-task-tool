import { TaskService } from '../../services/taskService';
import { ProjectService } from '../../services/projectService';
import { Task, TaskStatus, TaskPriority } from '../../../../shared/src/types';

// Mock dependencies
jest.mock('../../services/projectService');
jest.mock('../../config/dynamodb', () => ({
  dynamoDb: {
    send: jest.fn()
  },
  TABLES: {
    TASKS: 'tasks-table',
    PROJECTS: 'projects-table',
    USERS: 'users-table',
    PROJECT_MEMBERS: 'project-members-table',
    TASK_COMMENTS: 'task-comments-table'
  }
}));

const { dynamoDb, TABLES } = require('../../config/dynamodb');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockProjectService: jest.Mocked<ProjectService>;
  let mockDynamoDb: { send: jest.MockedFunction<any> };

  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    projectId: 'project-123',
    assigneeId: 'user-123',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-07'),
    estimatedHours: 8,
    actualHours: 4,
    dependencies: ['dep-task-1'],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  const mockDbTask = {
    ...mockTask,
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-01-07T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    taskService = new TaskService();
    mockProjectService = (taskService as any).projectService;
    mockDynamoDb = dynamoDb;
  });

  describe('getProjectTasks', () => {
    it('should return tasks for a project', async () => {
      mockProjectService.getProject.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({
        Items: [mockDbTask]
      });

      const result = await taskService.getProjectTasks('project-123', 'user-123');

      expect(mockProjectService.getProject).toHaveBeenCalledWith('project-123', 'user-123');
      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASKS,
            IndexName: 'ProjectIdIndex',
            KeyConditionExpression: 'projectId = :projectId'
          })
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTask);
    });

    it('should throw error when user has no access to project', async () => {
      mockProjectService.getProject.mockRejectedValue(new Error('Access denied'));

      await expect(taskService.getProjectTasks('project-123', 'user-123'))
        .rejects.toThrow('Access denied');
    });

    it('should return empty array when no tasks found', async () => {
      mockProjectService.getProject.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      const result = await taskService.getProjectTasks('project-123', 'user-123');

      expect(result).toEqual([]);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      mockProjectService.getProject.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({});

      const taskData = {
        title: 'New Task',
        description: 'New Description',
        projectId: 'project-123',
        assigneeId: 'user-123',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-07'),
        estimatedHours: 16,
        dependencies: ['dep-1']
      };

      const result = await taskService.createTask(taskData, 'user-123');

      expect(mockProjectService.getProject).toHaveBeenCalledWith('project-123', 'user-123');
      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASKS,
            Item: expect.objectContaining({
              title: 'New Task',
              description: 'New Description',
              projectId: 'project-123',
              assigneeId: 'user-123',
              status: TaskStatus.TODO,
              priority: TaskPriority.HIGH,
              startDate: '2024-02-01T00:00:00.000Z',
              endDate: '2024-02-07T00:00:00.000Z',
              estimatedHours: 16,
              dependencies: ['dep-1']
            })
          })
        })
      );
      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Task');
    });

    it('should handle string dates in task creation', async () => {
      mockProjectService.getProject.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({});

      const taskData = {
        title: 'New Task',
        projectId: 'project-123',
        startDate: '2024-02-01' as any,
        endDate: '2024-02-07' as any
      };

      const result = await taskService.createTask(taskData, 'user-123');

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should use default values for optional fields', async () => {
      mockProjectService.getProject.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({});

      const taskData = {
        title: 'Minimal Task',
        projectId: 'project-123'
      };

      const result = await taskService.createTask(taskData, 'user-123');

      expect(result.status).toBe(TaskStatus.TODO);
      expect(result.priority).toBe(TaskPriority.MEDIUM);
      expect(result.dependencies).toEqual([]);
    });
  });

  describe('getTask', () => {
    it('should return a task by ID', async () => {
      mockDynamoDb.send.mockResolvedValue({ Item: mockDbTask });
      mockProjectService.getProject.mockResolvedValue({} as any);

      const result = await taskService.getTask('task-123', 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASKS,
            Key: { id: 'task-123' }
          })
        })
      );
      expect(mockProjectService.getProject).toHaveBeenCalledWith('project-123', 'user-123');
      expect(result).toEqual(mockTask);
    });

    it('should throw error when task not found', async () => {
      mockDynamoDb.send.mockResolvedValue({ Item: null });

      await expect(taskService.getTask('nonexistent', 'user-123'))
        .rejects.toThrow('Task not found');
    });

    it('should throw error when user has no access to project', async () => {
      mockDynamoDb.send.mockResolvedValue({ Item: mockDbTask });
      mockProjectService.getProject.mockRejectedValue(new Error('Access denied'));

      await expect(taskService.getTask('task-123', 'user-123'))
        .rejects.toThrow('Access denied');
    });
  });

  describe('updateTask', () => {
    it('should update task fields', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: mockDbTask }) // getTask call
        .mockResolvedValueOnce({ Attributes: { ...mockDbTask, title: 'Updated Task' } }); // update call
      mockProjectService.getProject.mockResolvedValue({} as any);

      const updates = {
        title: 'Updated Task',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW
      };

      const result = await taskService.updateTask('task-123', updates, 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASKS,
            Key: { id: 'task-123' },
            UpdateExpression: expect.stringContaining('title = :title'),
            ExpressionAttributeValues: expect.objectContaining({
              ':title': 'Updated Task',
              ':status': TaskStatus.DONE,
              ':priority': TaskPriority.LOW
            })
          })
        })
      );
    });

    it('should handle date updates', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: mockDbTask })
        .mockResolvedValueOnce({ Attributes: mockDbTask });
      mockProjectService.getProject.mockResolvedValue({} as any);

      const updates = {
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-07')
      };

      await taskService.updateTask('task-123', updates, 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            ExpressionAttributeValues: expect.objectContaining({
              ':startDate': '2024-03-01T00:00:00.000Z',
              ':endDate': '2024-03-07T00:00:00.000Z'
            })
          })
        })
      );
    });

    it('should handle null date updates', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: mockDbTask })
        .mockResolvedValueOnce({ Attributes: mockDbTask });
      mockProjectService.getProject.mockResolvedValue({} as any);

      const updates = {
        startDate: undefined,
        endDate: undefined,
        title: 'Updated Title' // Add a field that will actually be updated
      };

      await taskService.updateTask('task-123', updates, 'user-123');

      // The service only includes defined values in the update expression
      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            UpdateExpression: expect.stringContaining('title = :title'),
            ExpressionAttributeValues: expect.objectContaining({
              ':title': 'Updated Title'
            })
          })
        })
      );
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: mockDbTask }) // getTask call
        .mockResolvedValueOnce({}); // delete call
      mockProjectService.getProject.mockResolvedValue({} as any);

      await taskService.deleteTask('task-123', 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASKS,
            Key: { id: 'task-123' }
          })
        })
      );
    });

    it('should throw error when task not found', async () => {
      mockDynamoDb.send.mockResolvedValue({ Item: null });

      await expect(taskService.deleteTask('nonexistent', 'user-123'))
        .rejects.toThrow('Task not found');
    });
  });

  describe('getUserTasks', () => {
    it('should return tasks assigned to user', async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [mockDbTask]
      });

      const result = await taskService.getUserTasks('user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASKS,
            IndexName: 'AssigneeIdIndex',
            KeyConditionExpression: 'assigneeId = :userId',
            ExpressionAttributeValues: {
              ':userId': 'user-123'
            }
          })
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTask);
    });

    it('should return empty array when user has no tasks', async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      const result = await taskService.getUserTasks('user-123');

      expect(result).toEqual([]);
    });
  });
});