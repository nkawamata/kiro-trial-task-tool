import WorkloadService from '../workloadService';
import { apiClient } from '../apiClient';

// Mock apiClient
jest.mock('../apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

describe('WorkloadService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  const mockWorkloadSummary = {
    userId: 'user-123',
    totalAllocatedHours: 32,
    averageDailyHours: 6.4,
    peakDailyHours: 8,
    utilizationRate: 0.8
  };

  const mockWorkloadEntry = {
    id: 'workload-123',
    userId: 'user-123',
    projectId: 'project-123',
    taskId: 'task-123',
    date: new Date('2024-01-01'),
    allocatedHours: 8,
    actualHours: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockWorkloadDistribution = {
    userId: 'user-123',
    totalCapacity: 40,
    allocated: 32,
    available: 8,
    projects: [
      {
        projectId: 'project-1',
        name: 'Project 1',
        percentage: 60,
        hours: 24
      },
      {
        projectId: 'project-2',
        name: 'Project 2',
        percentage: 40,
        hours: 16
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserWorkloadSummary', () => {
    it('should fetch user workload summary successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { summary: mockWorkloadSummary }
      });

      const result = await WorkloadService.getUserWorkloadSummary('2024-01-01', '2024-01-07');

      expect(mockApiClient.get).toHaveBeenCalledWith('/workload/summary', {
        params: { startDate: '2024-01-01', endDate: '2024-01-07' }
      });
      expect(result).toEqual(mockWorkloadSummary);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(WorkloadService.getUserWorkloadSummary('2024-01-01', '2024-01-07'))
        .rejects.toThrow('API Error');
    });
  });

  describe('getTeamWorkload', () => {
    it('should fetch team workload successfully', async () => {
      const mockTeamWorkload = [mockWorkloadSummary];
      mockApiClient.get.mockResolvedValue({
        data: { workload: mockTeamWorkload }
      });

      const result = await WorkloadService.getTeamWorkload('project-123', '2024-01-01', '2024-01-07');

      expect(mockApiClient.get).toHaveBeenCalledWith('/workload/team', {
        params: { projectId: 'project-123', startDate: '2024-01-01', endDate: '2024-01-07' }
      });
      expect(result).toEqual(mockTeamWorkload);
    });
  });

  describe('getAllProjectsTeamWorkloadSummary', () => {
    it('should fetch all projects team workload summary', async () => {
      const mockAllProjectsWorkload = [mockWorkloadSummary];
      mockApiClient.get.mockResolvedValue({
        data: { workload: mockAllProjectsWorkload }
      });

      const result = await WorkloadService.getAllProjectsTeamWorkloadSummary('2024-01-01', '2024-01-07');

      expect(mockApiClient.get).toHaveBeenCalledWith('/workload/team/all-projects', {
        params: { startDate: '2024-01-01', endDate: '2024-01-07' }
      });
      expect(result).toEqual(mockAllProjectsWorkload);
    });
  });

  describe('getWorkloadDistribution', () => {
    it('should fetch workload distribution successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { distribution: mockWorkloadDistribution }
      });

      const result = await WorkloadService.getWorkloadDistribution();

      expect(mockApiClient.get).toHaveBeenCalledWith('/workload/distribution');
      expect(result).toEqual(mockWorkloadDistribution);
    });
  });

  describe('allocateWorkload', () => {
    it('should allocate workload successfully', async () => {
      const allocationRequest = {
        userId: 'user-123',
        projectId: 'project-123',
        taskId: 'task-123',
        allocatedHours: 8,
        date: '2024-01-01'
      };

      mockApiClient.post.mockResolvedValue({
        data: { allocation: mockWorkloadEntry }
      });

      const result = await WorkloadService.allocateWorkload(allocationRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/workload/allocate', allocationRequest);
      expect(result).toEqual(mockWorkloadEntry);
    });

    it('should handle allocation errors', async () => {
      const allocationRequest = {
        userId: 'user-123',
        projectId: 'project-123',
        taskId: 'task-123',
        allocatedHours: 8,
        date: '2024-01-01'
      };

      mockApiClient.post.mockRejectedValue(new Error('Over-allocation detected'));

      await expect(WorkloadService.allocateWorkload(allocationRequest))
        .rejects.toThrow('Over-allocation detected');
    });
  });

  describe('updateWorkloadActualHours', () => {
    it('should update actual hours successfully', async () => {
      const updatedEntry = { ...mockWorkloadEntry, actualHours: 6 };
      mockApiClient.patch.mockResolvedValue({
        data: { workload: updatedEntry }
      });

      const result = await WorkloadService.updateWorkloadActualHours('workload-123', 6);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/workload/workload-123', {
        actualHours: 6
      });
      expect(result).toEqual(updatedEntry);
    });

    it('should handle invalid workload ID', async () => {
      mockApiClient.patch.mockRejectedValue(new Error('Workload not found'));

      await expect(WorkloadService.updateWorkloadActualHours('nonexistent', 6))
        .rejects.toThrow('Workload not found');
    });
  });

  describe('getWorkloadByDateRange', () => {
    it('should fetch workload entries by date range', async () => {
      const mockEntries = [mockWorkloadEntry];
      mockApiClient.get.mockResolvedValue({
        data: { entries: mockEntries }
      });

      const result = await WorkloadService.getWorkloadByDateRange('user-123', '2024-01-01', '2024-01-07');

      expect(mockApiClient.get).toHaveBeenCalledWith('/workload/entries', {
        params: { userId: 'user-123', startDate: '2024-01-01', endDate: '2024-01-07' }
      });
      expect(result).toEqual(mockEntries);
    });

    it('should return empty array when no entries found', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { entries: [] }
      });

      const result = await WorkloadService.getWorkloadByDateRange('user-123', '2024-01-01', '2024-01-07');

      expect(result).toEqual([]);
    });
  });

  describe('getTaskWorkloadEntries', () => {
    it('should filter workload entries by task ID', async () => {
      const allEntries = [
        { ...mockWorkloadEntry, taskId: 'task-123' },
        { ...mockWorkloadEntry, id: 'workload-456', taskId: 'task-456' }
      ];

      jest.spyOn(WorkloadService, 'getWorkloadByDateRange').mockResolvedValue(allEntries);

      const result = await WorkloadService.getTaskWorkloadEntries('task-123', 'user-123', '2024-01-01', '2024-01-07');

      expect(result).toHaveLength(1);
      expect(result[0].taskId).toBe('task-123');
    });

    it('should return empty array when no matching task entries found', async () => {
      const allEntries = [
        { ...mockWorkloadEntry, taskId: 'other-task' }
      ];

      jest.spyOn(WorkloadService, 'getWorkloadByDateRange').mockResolvedValue(allEntries);

      const result = await WorkloadService.getTaskWorkloadEntries('task-123', 'user-123', '2024-01-01', '2024-01-07');

      expect(result).toEqual([]);
    });
  });

  describe('getAllTaskWorkloadEntries', () => {
    it('should fetch all workload entries for a task', async () => {
      const mockEntries = [mockWorkloadEntry];
      mockApiClient.get.mockResolvedValue({
        data: { entries: mockEntries }
      });

      const result = await WorkloadService.getAllTaskWorkloadEntries('task-123', '2024-01-01', '2024-01-07');

      expect(mockApiClient.get).toHaveBeenCalledWith('/workload/task/task-123', {
        params: { startDate: '2024-01-01', endDate: '2024-01-07' }
      });
      expect(result).toEqual(mockEntries);
    });
  });

  describe('deleteWorkloadAllocation', () => {
    it('should delete workload allocation successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await WorkloadService.deleteWorkloadAllocation('workload-123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/workload/workload-123');
    });

    it('should handle deletion errors', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Workload not found'));

      await expect(WorkloadService.deleteWorkloadAllocation('nonexistent'))
        .rejects.toThrow('Workload not found');
    });
  });
});