import { GanttService } from '../../services/ganttService';
import { TaskService } from '../../services/taskService';
import { UserService } from '../../services/userService';
import { Task, TaskStatus, TaskPriority, User } from '../../../../shared/src/types';

// Mock dependencies
jest.mock('../../services/taskService');
jest.mock('../../services/userService');

describe('GanttService', () => {
  let ganttService: GanttService;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockUserService: jest.Mocked<UserService>;

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
    dependencies: ['dep-task-1'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUser: User = {
    id: 'user-123',
    cognitoId: 'cognito-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ganttService = new GanttService();
    mockTaskService = (ganttService as any).taskService;
    mockUserService = (ganttService as any).userService;
  });

  describe('getProjectGanttData', () => {
    it('should return gantt tasks with assignee names', async () => {
      mockTaskService.getProjectTasks.mockResolvedValue([mockTask]);
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      const result = await ganttService.getProjectGanttData('project-123', 'user-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'task-123',
        name: 'Test Task',
        start: new Date('2024-01-01'),
        end: new Date('2024-01-07'),
        progress: 50, // IN_PROGRESS = 50%
        dependencies: ['dep-task-1'],
        assignee: 'Test User',
        projectId: 'project-123'
      });
    });

    it('should handle tasks without assignees', async () => {
      const taskWithoutAssignee = { ...mockTask, assigneeId: undefined };
      mockTaskService.getProjectTasks.mockResolvedValue([taskWithoutAssignee]);

      const result = await ganttService.getProjectGanttData('project-123', 'user-123');

      expect(result[0].assignee).toBe('Unassigned');
    });

    it('should handle unknown assignees', async () => {
      mockTaskService.getProjectTasks.mockResolvedValue([mockTask]);
      mockUserService.getUserProfile.mockRejectedValue(new Error('User not found'));

      const result = await ganttService.getProjectGanttData('project-123', 'user-123');

      expect(result[0].assignee).toBe('Unknown User');
    });

    it('should use default dates when task dates are missing', async () => {
      const taskWithoutDates = { ...mockTask, startDate: undefined, endDate: undefined };
      mockTaskService.getProjectTasks.mockResolvedValue([taskWithoutDates]);
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      const result = await ganttService.getProjectGanttData('project-123', 'user-123');

      expect(result[0].start).toBeInstanceOf(Date);
      expect(result[0].end).toBeInstanceOf(Date);
      expect(result[0].end.getTime()).toBeGreaterThan(result[0].start.getTime());
    });

    it('should calculate progress correctly for different task statuses', async () => {
      const tasks = [
        { ...mockTask, id: 'task-1', status: TaskStatus.TODO },
        { ...mockTask, id: 'task-2', status: TaskStatus.IN_PROGRESS },
        { ...mockTask, id: 'task-3', status: TaskStatus.IN_REVIEW },
        { ...mockTask, id: 'task-4', status: TaskStatus.DONE },
        { ...mockTask, id: 'task-5', status: TaskStatus.BLOCKED }
      ];

      mockTaskService.getProjectTasks.mockResolvedValue(tasks);
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      const result = await ganttService.getProjectGanttData('project-123', 'user-123');

      expect(result[0].progress).toBe(0);   // TODO
      expect(result[1].progress).toBe(50);  // IN_PROGRESS
      expect(result[2].progress).toBe(80);  // IN_REVIEW
      expect(result[3].progress).toBe(100); // DONE
      expect(result[4].progress).toBe(25);  // BLOCKED
    });
  });

  describe('getMultiProjectGanttData', () => {
    it('should combine tasks from multiple projects', async () => {
      const project1Tasks = [{ ...mockTask, id: 'task-1', projectId: 'project-1' }];
      const project2Tasks = [{ ...mockTask, id: 'task-2', projectId: 'project-2' }];

      mockTaskService.getProjectTasks
        .mockResolvedValueOnce(project1Tasks)
        .mockResolvedValueOnce(project2Tasks);
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      const result = await ganttService.getMultiProjectGanttData(['project-1', 'project-2'], 'user-123');

      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe('project-1');
      expect(result[1].projectId).toBe('project-2');
    });

    it('should continue with other projects when one fails', async () => {
      const project2Tasks = [{ ...mockTask, id: 'task-2', projectId: 'project-2' }];

      mockTaskService.getProjectTasks
        .mockRejectedValueOnce(new Error('Project 1 error'))
        .mockResolvedValueOnce(project2Tasks);
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await ganttService.getMultiProjectGanttData(['project-1', 'project-2'], 'user-123');

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project-2');
      expect(consoleSpy).toHaveBeenCalledWith('Error getting Gantt data for project project-1:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('updateTaskTimeline', () => {
    it('should update task timeline when dependencies are valid', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-07');
      const updatedTask = { ...mockTask, startDate, endDate };

      // Mock dependency validation
      mockTaskService.getTask.mockResolvedValue(mockTask);
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const result = await ganttService.updateTaskTimeline('task-123', startDate, endDate, 'user-123');

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('task-123', {
        startDate,
        endDate
      }, 'user-123');
      expect(result).toEqual(updatedTask);
    });

    it('should throw error when dependencies are violated', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      
      // Mock dependency task that ends after new start date
      const dependencyTask = { ...mockTask, id: 'dep-task-1', endDate: new Date('2024-01-05') };
      
      mockTaskService.getTask
        .mockResolvedValueOnce(mockTask) // Main task
        .mockResolvedValueOnce(dependencyTask); // Dependency task

      await expect(
        ganttService.updateTaskTimeline('task-123', startDate, endDate, 'user-123')
      ).rejects.toThrow('Timeline update would violate task dependencies');
    });

    it('should handle missing dependency tasks gracefully', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-07');
      const updatedTask = { ...mockTask, startDate, endDate };

      mockTaskService.getTask
        .mockResolvedValueOnce(mockTask) // Main task
        .mockRejectedValueOnce(new Error('Dependency not found')); // Missing dependency
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const result = await ganttService.updateTaskTimeline('task-123', startDate, endDate, 'user-123');

      expect(result).toEqual(updatedTask);
    });

    it('should handle validation errors', async () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-07');

      mockTaskService.getTask.mockRejectedValue(new Error('Task not found'));

      await expect(
        ganttService.updateTaskTimeline('task-123', startDate, endDate, 'user-123')
      ).rejects.toThrow('Timeline update would violate task dependencies');
    });
  });
});