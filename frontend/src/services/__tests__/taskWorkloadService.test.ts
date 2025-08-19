import { taskWorkloadService, WorkloadDistributionStrategy } from '../taskWorkloadService';
import { apiClient } from '../apiClient';

// Mock apiClient
jest.mock('../apiClient');

describe('taskWorkloadService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  const mockAssignmentSuggestion = {
    userId: 'user-123',
    userName: 'Test User',
    currentCapacity: 20,
    availableCapacity: 20,
    utilizationRate: 0.5,
    recommendationScore: 85,
    reason: 'Good availability and balanced workload'
  };

  const mockWorkloadImpact = {
    currentWorkload: 20,
    newWorkload: 28,
    capacityUtilization: 0.7,
    isOverAllocated: false,
    affectedDates: ['2024-01-01', '2024-01-02', '2024-01-03']
  };

  const mockCapacityInfo = {
    userId: 'user-123',
    userName: 'Test User',
    totalCapacity: 40,
    allocatedHours: 20,
    availableHours: 20,
    utilizationRate: 0.5,
    isOverAllocated: false
  };

  const mockAssignTaskResponse = {
    task: {
      id: 'task-123',
      title: 'Test Task',
      assigneeId: 'user-123'
    },
    workloadEntries: [
      {
        id: 'workload-123',
        userId: 'user-123',
        taskId: 'task-123',
        allocatedHours: 4
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assignTaskWithWorkload', () => {
    it('should assign task with workload successfully', async () => {
      const request = {
        assigneeId: 'user-123',
        distributionStrategy: WorkloadDistributionStrategy.EVEN,
        autoAllocate: true
      };

      mockApiClient.post.mockResolvedValue({
        data: mockAssignTaskResponse
      });

      const result = await taskWorkloadService.assignTaskWithWorkload('task-123', request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tasks/task-123/assign-with-workload', request);
      expect(result).toEqual(mockAssignTaskResponse);
    });

    it('should handle assignment errors', async () => {
      const request = {
        assigneeId: 'user-123'
      };

      mockApiClient.post.mockRejectedValue(new Error('User not found'));

      await expect(taskWorkloadService.assignTaskWithWorkload('task-123', request))
        .rejects.toThrow('User not found');
    });

    it('should support custom distribution strategy', async () => {
      const request = {
        assigneeId: 'user-123',
        distributionStrategy: WorkloadDistributionStrategy.CUSTOM,
        customDistribution: [8, 6, 4, 2]
      };

      mockApiClient.post.mockResolvedValue({
        data: mockAssignTaskResponse
      });

      await taskWorkloadService.assignTaskWithWorkload('task-123', request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tasks/task-123/assign-with-workload', request);
    });
  });

  describe('getAssignmentSuggestions', () => {
    it('should fetch assignment suggestions successfully', async () => {
      const mockSuggestions = [mockAssignmentSuggestion];
      mockApiClient.get.mockResolvedValue({
        data: { suggestions: mockSuggestions }
      });

      const result = await taskWorkloadService.getAssignmentSuggestions('task-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/tasks/task-123/assignment-suggestions');
      expect(result).toEqual(mockSuggestions);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Task not found'));

      await expect(taskWorkloadService.getAssignmentSuggestions('nonexistent'))
        .rejects.toThrow('Task not found');
    });
  });

  describe('getWorkloadImpact', () => {
    it('should fetch workload impact successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { impact: mockWorkloadImpact }
      });

      const result = await taskWorkloadService.getWorkloadImpact('task-123', 'user-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/tasks/task-123/workload-impact/user-123');
      expect(result).toEqual(mockWorkloadImpact);
    });

    it('should handle impact calculation errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Insufficient data'));

      await expect(taskWorkloadService.getWorkloadImpact('task-123', 'user-123'))
        .rejects.toThrow('Insufficient data');
    });
  });

  describe('getUserCapacity', () => {
    it('should fetch user capacity without date range', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { capacity: mockCapacityInfo }
      });

      const result = await taskWorkloadService.getUserCapacity('user-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/tasks/capacity/user-123?');
      expect(result).toEqual(mockCapacityInfo);
    });

    it('should fetch user capacity with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      mockApiClient.get.mockResolvedValue({
        data: { capacity: mockCapacityInfo }
      });

      const result = await taskWorkloadService.getUserCapacity('user-123', startDate, endDate);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/capacity/user-123?startDate=2024-01-01T00%3A00%3A00.000Z&endDate=2024-01-07T00%3A00%3A00.000Z')
      );
      expect(result).toEqual(mockCapacityInfo);
    });

    it('should handle capacity fetch errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('User not found'));

      await expect(taskWorkloadService.getUserCapacity('nonexistent'))
        .rejects.toThrow('User not found');
    });
  });

  describe('getMultipleUserCapacities', () => {
    it('should fetch capacities for multiple users', async () => {
      const userIds = ['user-1', 'user-2'];
      const capacities = [
        { ...mockCapacityInfo, userId: 'user-1', userName: 'User 1' },
        { ...mockCapacityInfo, userId: 'user-2', userName: 'User 2' }
      ];

      mockApiClient.get
        .mockResolvedValueOnce({ data: { capacity: capacities[0] } })
        .mockResolvedValueOnce({ data: { capacity: capacities[1] } });

      const result = await taskWorkloadService.getMultipleUserCapacities(userIds);

      expect(result).toEqual(capacities);
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle individual user failures gracefully', async () => {
      const userIds = ['user-1', 'user-2'];
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockApiClient.get
        .mockResolvedValueOnce({ data: { capacity: { ...mockCapacityInfo, userId: 'user-1' } } })
        .mockRejectedValueOnce(new Error('User not found'));

      const result = await taskWorkloadService.getMultipleUserCapacities(userIds);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-1');
      expect(result[1]).toEqual({
        userId: 'user-2',
        userName: 'Unknown User',
        totalCapacity: 0,
        allocatedHours: 0,
        availableHours: 0,
        utilizationRate: 0,
        isOverAllocated: false
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get capacity for user user-2:', expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isUserOverAllocated', () => {
    it('should return true when user is over-allocated', async () => {
      const overAllocatedCapacity = { ...mockCapacityInfo, isOverAllocated: true };
      mockApiClient.get.mockResolvedValue({
        data: { capacity: overAllocatedCapacity }
      });

      const result = await taskWorkloadService.isUserOverAllocated('user-123');

      expect(result).toBe(true);
    });

    it('should return false when user is not over-allocated', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { capacity: mockCapacityInfo }
      });

      const result = await taskWorkloadService.isUserOverAllocated('user-123');

      expect(result).toBe(false);
    });

    it('should return false on API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await taskWorkloadService.isUserOverAllocated('user-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getOptimalAssignees', () => {
    it('should return top suggestions sorted by score', async () => {
      const suggestions = [
        { ...mockAssignmentSuggestion, userId: 'user-1', recommendationScore: 70 },
        { ...mockAssignmentSuggestion, userId: 'user-2', recommendationScore: 90 },
        { ...mockAssignmentSuggestion, userId: 'user-3', recommendationScore: 80 },
        { ...mockAssignmentSuggestion, userId: 'user-4', recommendationScore: 60 }
      ];

      mockApiClient.get.mockResolvedValue({
        data: { suggestions }
      });

      const result = await taskWorkloadService.getOptimalAssignees('task-123', 3);

      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe('user-2'); // Highest score
      expect(result[1].userId).toBe('user-3'); // Second highest
      expect(result[2].userId).toBe('user-1'); // Third highest
    });

    it('should return empty array on API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await taskWorkloadService.getOptimalAssignees('task-123');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get optimal assignees:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('validateAssignment', () => {
    it('should validate assignment successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { impact: mockWorkloadImpact }
      });

      const result = await taskWorkloadService.validateAssignment('task-123', 'user-123');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.impact).toEqual(mockWorkloadImpact);
    });

    it('should detect over-allocation warnings', async () => {
      const overAllocatedImpact = { ...mockWorkloadImpact, isOverAllocated: true };
      mockApiClient.get.mockResolvedValue({
        data: { impact: overAllocatedImpact }
      });

      const result = await taskWorkloadService.validateAssignment('task-123', 'user-123');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('This assignment will overload the team member');
    });

    it('should detect high capacity utilization warnings', async () => {
      const highUtilizationImpact = { ...mockWorkloadImpact, capacityUtilization: 0.95 };
      mockApiClient.get.mockResolvedValue({
        data: { impact: highUtilizationImpact }
      });

      const result = await taskWorkloadService.validateAssignment('task-123', 'user-123');

      expect(result.warnings).toContain('Team member will be at near-full capacity');
    });

    it('should handle validation errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const result = await taskWorkloadService.validateAssignment('task-123', 'user-123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to validate assignment');
    });
  });

  describe('getTeamCapacityOverview', () => {
    it('should calculate team capacity overview', async () => {
      const userIds = ['user-1', 'user-2'];
      const capacities = [
        { ...mockCapacityInfo, userId: 'user-1', totalCapacity: 40, allocatedHours: 30, availableHours: 10, isOverAllocated: false },
        { ...mockCapacityInfo, userId: 'user-2', totalCapacity: 40, allocatedHours: 45, availableHours: -5, isOverAllocated: true }
      ];

      jest.spyOn(taskWorkloadService, 'getMultipleUserCapacities').mockResolvedValue(capacities);

      const result = await taskWorkloadService.getTeamCapacityOverview(userIds);

      expect(result).toEqual({
        totalCapacity: 80,
        totalAllocated: 75,
        totalAvailable: 5,
        averageUtilization: 0.9375, // 75/80
        overAllocatedMembers: 1,
        capacities
      });
    });

    it('should handle empty team', async () => {
      jest.spyOn(taskWorkloadService, 'getMultipleUserCapacities').mockResolvedValue([]);

      const result = await taskWorkloadService.getTeamCapacityOverview([]);

      expect(result).toEqual({
        totalCapacity: 0,
        totalAllocated: 0,
        totalAvailable: 0,
        averageUtilization: 0,
        overAllocatedMembers: 0,
        capacities: []
      });
    });

    it('should handle team capacity overview with date range', async () => {
      const userIds = ['user-1'];
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      const capacities = [
        { ...mockCapacityInfo, userId: 'user-1', totalCapacity: 40, allocatedHours: 20, availableHours: 20, isOverAllocated: false }
      ];

      jest.spyOn(taskWorkloadService, 'getMultipleUserCapacities').mockResolvedValue(capacities);

      const result = await taskWorkloadService.getTeamCapacityOverview(userIds, startDate, endDate);

      expect(result).toEqual({
        totalCapacity: 40,
        totalAllocated: 20,
        totalAvailable: 20,
        averageUtilization: 0.5,
        overAllocatedMembers: 0,
        capacities
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network timeout'));

      await expect(taskWorkloadService.getUserCapacity('user-123'))
        .rejects.toThrow('Network timeout');
    });

    it('should handle malformed API responses', async () => {
      mockApiClient.get.mockResolvedValue({ data: null });

      await expect(taskWorkloadService.getAssignmentSuggestions('task-123'))
        .rejects.toThrow();
    });

    it('should validate assignment with multiple warnings', async () => {
      const overAllocatedHighUtilizationImpact = { 
        ...mockWorkloadImpact, 
        isOverAllocated: true, 
        capacityUtilization: 0.95 
      };
      
      mockApiClient.get.mockResolvedValue({
        data: { impact: overAllocatedHighUtilizationImpact }
      });

      const result = await taskWorkloadService.validateAssignment('task-123', 'user-123');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings).toContain('This assignment will overload the team member');
      expect(result.warnings).toContain('Team member will be at near-full capacity');
    });
  });
});