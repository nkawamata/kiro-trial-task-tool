import { apiClient } from './apiClient';

export interface AssignmentSuggestion {
  userId: string;
  userName: string;
  currentCapacity: number;
  availableCapacity: number;
  utilizationRate: number;
  recommendationScore: number;
  reason: string;
}

export interface WorkloadImpact {
  currentWorkload: number;
  newWorkload: number;
  capacityUtilization: number;
  isOverAllocated: boolean;
  affectedDates: string[];
}

export interface CapacityInfo {
  userId: string;
  userName: string;
  totalCapacity: number;
  allocatedHours: number;
  availableHours: number;
  utilizationRate: number;
  isOverAllocated: boolean;
}

export enum WorkloadDistributionStrategy {
  EVEN = 'even',
  FRONT_LOADED = 'front_loaded',
  BACK_LOADED = 'back_loaded',
  CUSTOM = 'custom'
}

export interface AssignTaskWithWorkloadRequest {
  assigneeId: string;
  distributionStrategy?: WorkloadDistributionStrategy;
  customDistribution?: number[];
  autoAllocate?: boolean;
}

export interface AssignTaskWithWorkloadResponse {
  task: any;
  workloadEntries: any[];
}

class TaskWorkloadService {
  /**
   * Assign a task with automatic workload allocation
   */
  async assignTaskWithWorkload(
    taskId: string,
    request: AssignTaskWithWorkloadRequest
  ): Promise<AssignTaskWithWorkloadResponse> {
    const response = await apiClient.post(`/tasks/${taskId}/assign-with-workload`, request);
    return response.data;
  }

  /**
   * Get assignment suggestions for a task
   */
  async getAssignmentSuggestions(taskId: string): Promise<AssignmentSuggestion[]> {
    const response = await apiClient.get(`/tasks/${taskId}/assignment-suggestions`);
    return response.data.suggestions;
  }

  /**
   * Get workload impact preview for assigning a task
   */
  async getWorkloadImpact(taskId: string, assigneeId: string): Promise<WorkloadImpact> {
    const response = await apiClient.get(`/tasks/${taskId}/workload-impact/${assigneeId}`);
    return response.data.impact;
  }

  /**
   * Get user capacity information
   */
  async getUserCapacity(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CapacityInfo> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await apiClient.get(`/tasks/capacity/${userId}?${params.toString()}`);
    return response.data.capacity;
  }

  /**
   * Get capacity information for multiple users
   */
  async getMultipleUserCapacities(
    userIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<CapacityInfo[]> {
    const capacities = await Promise.all(
      userIds.map(userId => 
        this.getUserCapacity(userId, startDate, endDate).catch(error => {
          console.warn(`Failed to get capacity for user ${userId}:`, error);
          return {
            userId,
            userName: 'Unknown User',
            totalCapacity: 0,
            allocatedHours: 0,
            availableHours: 0,
            utilizationRate: 0,
            isOverAllocated: false
          };
        })
      )
    );

    return capacities;
  }

  /**
   * Check if a user is over-allocated for a given period
   */
  async isUserOverAllocated(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<boolean> {
    try {
      const capacity = await this.getUserCapacity(userId, startDate, endDate);
      return capacity.isOverAllocated;
    } catch (error) {
      console.warn(`Failed to check allocation for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get optimal assignee suggestions based on workload
   */
  async getOptimalAssignees(
    taskId: string,
    maxSuggestions: number = 3
  ): Promise<AssignmentSuggestion[]> {
    try {
      const suggestions = await this.getAssignmentSuggestions(taskId);
      return suggestions
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, maxSuggestions);
    } catch (error) {
      console.warn('Failed to get optimal assignees:', error);
      return [];
    }
  }

  /**
   * Validate assignment before submission
   */
  async validateAssignment(
    taskId: string,
    assigneeId: string
  ): Promise<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
    impact?: WorkloadImpact;
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const impact = await this.getWorkloadImpact(taskId, assigneeId);

      if (impact.isOverAllocated) {
        warnings.push('This assignment will overload the team member');
      }

      if (impact.capacityUtilization > 0.9) {
        warnings.push('Team member will be at near-full capacity');
      }

      // Could add more validation rules here
      // For example, checking for conflicting assignments, skill requirements, etc.

      return {
        isValid: errors.length === 0,
        warnings,
        errors,
        impact
      };
    } catch (error) {
      errors.push('Failed to validate assignment');
      return {
        isValid: false,
        warnings,
        errors
      };
    }
  }

  /**
   * Get team capacity overview for a project
   */
  async getTeamCapacityOverview(
    userIds: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCapacity: number;
    totalAllocated: number;
    totalAvailable: number;
    averageUtilization: number;
    overAllocatedMembers: number;
    capacities: CapacityInfo[];
  }> {
    const capacities = await this.getMultipleUserCapacities(userIds, startDate, endDate);

    const totalCapacity = capacities.reduce((sum, c) => sum + c.totalCapacity, 0);
    const totalAllocated = capacities.reduce((sum, c) => sum + c.allocatedHours, 0);
    const totalAvailable = capacities.reduce((sum, c) => sum + c.availableHours, 0);
    const averageUtilization = totalCapacity > 0 ? totalAllocated / totalCapacity : 0;
    const overAllocatedMembers = capacities.filter(c => c.isOverAllocated).length;

    return {
      totalCapacity,
      totalAllocated,
      totalAvailable,
      averageUtilization,
      overAllocatedMembers,
      capacities
    };
  }
}

export const taskWorkloadService = new TaskWorkloadService();