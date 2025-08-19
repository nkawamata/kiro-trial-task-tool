import { taskService } from '../taskService';
import { apiClient } from '../apiClient';
import { TaskStatus, TaskPriority } from '@task-manager/shared';

// Mock the apiClient
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task',
        projectId: 'project-123',
        assigneeId: 'user-123',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        estimatedHours: 8
      };

      const mockTask = {
        id: 'task-123',
        title: taskData.title,
        description: taskData.description,
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId,
        status: taskData.status,
        priority: taskData.priority,
        startDate: taskData.startDate.toISOString(),
        endDate: taskData.endDate.toISOString(),
        estimatedHours: taskData.estimatedHours,
        createdAt: new Date().toISOString()
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { task: mockTask } 
      });

      const result = await taskService.createTask(taskData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tasks', {
        title: taskData.title,
        description: taskData.description,
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId,
        status: taskData.status,
        priority: taskData.priority,
        startDate: taskData.startDate.toISOString(),
        endDate: taskData.endDate.toISOString(),
        estimatedHours: taskData.estimatedHours
      });
      expect(result).toEqual(mockTask);
    });

    it('should create task with minimal data', async () => {
      const taskData = {
        title: 'Minimal Task',
        projectId: 'project-123',
        assigneeId: 'user-123',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW
      };

      const mockTask = {
        id: 'task-123',
        ...taskData,
        createdAt: new Date().toISOString()
      };

      mockApiClient.post.mockResolvedValue({ 
        data: { task: mockTask } 
      });

      const result = await taskService.createTask(taskData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tasks', {
        title: taskData.title,
        description: undefined,
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId,
        status: taskData.status,
        priority: taskData.priority,
        startDate: undefined,
        endDate: undefined,
        estimatedHours: undefined
      });
      expect(result).toEqual(mockTask);
    });

    it('should handle creation error', async () => {
      const taskData = {
        title: 'Test Task',
        projectId: 'project-123',
        assigneeId: 'user-123',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM
      };

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid task data' }
        }
      };

      mockApiClient.post.mockRejectedValue(errorResponse);

      await expect(taskService.createTask(taskData)).rejects.toEqual(errorResponse);
    });
  });

  describe('getProjectTasks', () => {
    it('should fetch project tasks successfully', async () => {
      const projectId = 'project-123';
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          projectId,
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH
        },
        {
          id: 'task-2',
          title: 'Task 2',
          projectId,
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM
        }
      ];

      mockApiClient.get.mockResolvedValue({ 
        data: { tasks: mockTasks } 
      });

      const result = await taskService.getProjectTasks(projectId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tasks/project/${projectId}`);
      expect(result).toEqual(mockTasks);
    });

    it('should handle empty project tasks', async () => {
      const projectId = 'empty-project';

      mockApiClient.get.mockResolvedValue({ 
        data: { tasks: [] } 
      });

      const result = await taskService.getProjectTasks(projectId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserTasks', () => {
    it('should fetch user tasks successfully', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'My Task 1',
          assigneeId: 'user-123',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH
        },
        {
          id: 'task-2',
          title: 'My Task 2',
          assigneeId: 'user-123',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM
        }
      ];

      mockApiClient.get.mockResolvedValue({ 
        data: { tasks: mockTasks } 
      });

      const result = await taskService.getUserTasks();

      expect(mockApiClient.get).toHaveBeenCalledWith('/tasks/user');
      expect(result).toEqual(mockTasks);
    });

    it('should handle no user tasks', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: { tasks: [] } 
      });

      const result = await taskService.getUserTasks();

      expect(result).toEqual([]);
    });
  });

  describe('getTask', () => {
    it('should fetch task by id successfully', async () => {
      const taskId = 'task-123';
      const mockTask = {
        id: taskId,
        title: 'Test Task',
        description: 'A test task',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM
      };

      mockApiClient.get.mockResolvedValue({ 
        data: { task: mockTask } 
      });

      const result = await taskService.getTask(taskId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tasks/${taskId}`);
      expect(result).toEqual(mockTask);
    });

    it('should handle task not found', async () => {
      const taskId = 'non-existent-task';
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Task not found' }
        }
      };

      mockApiClient.get.mockRejectedValue(errorResponse);

      await expect(taskService.getTask(taskId)).rejects.toEqual(errorResponse);
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const taskId = 'task-123';
      const updates = {
        title: 'Updated Task',
        description: 'Updated description',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        startDate: new Date('2024-01-02'),
        endDate: new Date('2024-01-06'),
        estimatedHours: 12
      };

      const mockUpdatedTask = {
        id: taskId,
        ...updates,
        startDate: updates.startDate.toISOString(),
        endDate: updates.endDate.toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockApiClient.put.mockResolvedValue({ 
        data: { task: mockUpdatedTask } 
      });

      const result = await taskService.updateTask(taskId, updates);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/tasks/${taskId}`, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        startDate: updates.startDate.toISOString(),
        endDate: updates.endDate.toISOString(),
        estimatedHours: updates.estimatedHours
      });
      expect(result).toEqual(mockUpdatedTask);
    });

    it('should handle partial updates', async () => {
      const taskId = 'task-123';
      const updates = {
        status: TaskStatus.COMPLETED
      };

      const mockUpdatedTask = {
        id: taskId,
        title: 'Existing Task',
        status: TaskStatus.COMPLETED,
        updatedAt: new Date().toISOString()
      };

      mockApiClient.put.mockResolvedValue({ 
        data: { task: mockUpdatedTask } 
      });

      const result = await taskService.updateTask(taskId, updates);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/tasks/${taskId}`, {
        status: updates.status,
        startDate: undefined,
        endDate: undefined
      });
      expect(result).toEqual(mockUpdatedTask);
    });

    it('should handle update error', async () => {
      const taskId = 'task-123';
      const updates = { title: '' };

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Title cannot be empty' }
        }
      };

      mockApiClient.put.mockRejectedValue(errorResponse);

      await expect(taskService.updateTask(taskId, updates)).rejects.toEqual(errorResponse);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const taskId = 'task-123';

      mockApiClient.delete.mockResolvedValue({});

      await taskService.deleteTask(taskId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/tasks/${taskId}`);
    });

    it('should handle delete error', async () => {
      const taskId = 'task-123';
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Task not found' }
        }
      };

      mockApiClient.delete.mockRejectedValue(errorResponse);

      await expect(taskService.deleteTask(taskId)).rejects.toEqual(errorResponse);
    });

    it('should handle network error during delete', async () => {
      const taskId = 'task-123';
      const errorMessage = 'Network error';
      
      mockApiClient.delete.mockRejectedValue(new Error(errorMessage));

      await expect(taskService.deleteTask(taskId)).rejects.toThrow(errorMessage);
    });
  });
});