import { TaskService } from './taskService';
import { WorkloadService } from './workloadService';
import { UserService } from './userService';
import { Task, WorkloadEntry, User } from '../../../shared/src/types';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

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

export class TaskWorkloadIntegrationService {
  private taskService = new TaskService();
  private workloadService = new WorkloadService();
  private userService = new UserService();

  private readonly STANDARD_WEEKLY_CAPACITY = 40;
  private readonly OVER_ALLOCATION_THRESHOLD = 1.1; // 110% of capacity

  /**
   * Assign a task with automatic workload allocation
   */
  async assignTaskWithWorkload(
    taskId: string,
    assigneeId: string,
    requesterId: string,
    options: {
      distributionStrategy?: WorkloadDistributionStrategy;
      customDistribution?: number[];
      autoAllocate?: boolean;
    } = {}
  ): Promise<{ task: Task; workloadEntries: WorkloadEntry[] }> {
    const { distributionStrategy = WorkloadDistributionStrategy.EVEN, autoAllocate = true } = options;

    // Get the task and update assignment
    const task = await this.taskService.updateTask(taskId, { assigneeId }, requesterId);
    
    let workloadEntries: WorkloadEntry[] = [];

    if (autoAllocate && task.estimatedHours && task.startDate && task.endDate) {
      // Create workload entries based on distribution strategy
      workloadEntries = await this.createWorkloadEntries(
        task,
        assigneeId,
        distributionStrategy,
        options.customDistribution
      );
    }

    return { task, workloadEntries };
  }

  /**
   * Get assignment suggestions for a task
   */
  async getAssignmentSuggestions(
    taskId: string,
    requesterId: string,
    projectMembers: string[]
  ): Promise<AssignmentSuggestion[]> {
    const task = await this.taskService.getTask(taskId, requesterId);
    
    if (!task.estimatedHours || !task.startDate || !task.endDate) {
      // If task doesn't have complete scheduling info, return basic suggestions
      return this.getBasicAssignmentSuggestions(projectMembers);
    }

    const suggestions: AssignmentSuggestion[] = [];
    const taskDuration = differenceInDays(task.endDate, task.startDate) + 1;
    const dailyHours = task.estimatedHours / taskDuration;

    for (const userId of projectMembers) {
      try {
        const user = await this.userService.getUserProfile(userId);
        const capacity = await this.getUserCapacityInfo(userId, task.startDate, task.endDate);
        
        // Calculate recommendation score based on availability and workload balance
        const availabilityScore = Math.max(0, 1 - capacity.utilizationRate);
        const balanceScore = capacity.utilizationRate < 0.8 ? 1 : Math.max(0, 1 - (capacity.utilizationRate - 0.8) * 5);
        const recommendationScore = (availabilityScore * 0.6 + balanceScore * 0.4) * 100;

        let reason = '';
        if (capacity.utilizationRate < 0.5) {
          reason = 'Low current workload, good availability';
        } else if (capacity.utilizationRate < 0.8) {
          reason = 'Moderate workload, good fit';
        } else if (capacity.utilizationRate < 1.0) {
          reason = 'High workload but still available';
        } else {
          reason = 'Over-allocated, may cause delays';
        }

        suggestions.push({
          userId,
          userName: user.name,
          currentCapacity: capacity.allocatedHours,
          availableCapacity: capacity.availableHours,
          utilizationRate: capacity.utilizationRate,
          recommendationScore,
          reason
        });
      } catch (error) {
        console.warn(`Failed to get capacity info for user ${userId}:`, error);
      }
    }

    // Sort by recommendation score (highest first)
    return suggestions.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Get workload impact preview for assigning a task
   */
  async getWorkloadImpact(
    taskId: string,
    assigneeId: string,
    requesterId: string
  ): Promise<WorkloadImpact> {
    const task = await this.taskService.getTask(taskId, requesterId);
    
    if (!task.estimatedHours || !task.startDate || !task.endDate) {
      return {
        currentWorkload: 0,
        newWorkload: 0,
        capacityUtilization: 0,
        isOverAllocated: false,
        affectedDates: []
      };
    }

    const startDate = format(task.startDate, 'yyyy-MM-dd');
    const endDate = format(task.endDate, 'yyyy-MM-dd');
    
    // Get current workload
    const currentSummary = await this.workloadService.getUserWorkloadSummary(
      assigneeId,
      startDate,
      endDate
    );

    const taskDuration = differenceInDays(task.endDate, task.startDate) + 1;
    const weeklyCapacity = this.STANDARD_WEEKLY_CAPACITY;
    const totalCapacityForPeriod = (taskDuration / 7) * weeklyCapacity;
    
    const currentWorkload = currentSummary.totalAllocatedHours;
    const newWorkload = currentWorkload + task.estimatedHours;
    const capacityUtilization = newWorkload / totalCapacityForPeriod;
    const isOverAllocated = capacityUtilization > this.OVER_ALLOCATION_THRESHOLD;

    // Generate affected dates
    const affectedDates: string[] = [];
    let currentDate = task.startDate;
    while (currentDate <= task.endDate) {
      affectedDates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }

    return {
      currentWorkload,
      newWorkload,
      capacityUtilization,
      isOverAllocated,
      affectedDates
    };
  }

  /**
   * Get user capacity information for a date range
   */
  async getUserCapacityInfo(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CapacityInfo> {
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    try {
      const user = await this.userService.getUserProfile(userId);
      const summary = await this.workloadService.getUserWorkloadSummary(
        userId,
        startDateStr,
        endDateStr
      );

      const duration = differenceInDays(endDate, startDate) + 1;
      const totalCapacity = (duration / 7) * this.STANDARD_WEEKLY_CAPACITY;
      const allocatedHours = summary.totalAllocatedHours;
      const availableHours = Math.max(0, totalCapacity - allocatedHours);
      const utilizationRate = totalCapacity > 0 ? allocatedHours / totalCapacity : 0;
      const isOverAllocated = utilizationRate > this.OVER_ALLOCATION_THRESHOLD;

      return {
        userId,
        userName: user.name,
        totalCapacity,
        allocatedHours,
        availableHours,
        utilizationRate,
        isOverAllocated
      };
    } catch (error) {
      // Return default capacity info if user not found
      return {
        userId,
        userName: 'Unknown User',
        totalCapacity: 0,
        allocatedHours: 0,
        availableHours: 0,
        utilizationRate: 0,
        isOverAllocated: false
      };
    }
  }

  /**
   * Create workload entries for a task based on distribution strategy
   */
  private async createWorkloadEntries(
    task: Task,
    assigneeId: string,
    strategy: WorkloadDistributionStrategy,
    customDistribution?: number[]
  ): Promise<WorkloadEntry[]> {
    if (!task.estimatedHours || !task.startDate || !task.endDate) {
      return [];
    }

    const workloadEntries: WorkloadEntry[] = [];
    const taskDuration = differenceInDays(task.endDate, task.startDate) + 1;
    
    let dailyHours: number[];

    switch (strategy) {
      case WorkloadDistributionStrategy.EVEN:
        dailyHours = this.distributeEvenly(task.estimatedHours, taskDuration);
        break;
      case WorkloadDistributionStrategy.FRONT_LOADED:
        dailyHours = this.distributeFrontLoaded(task.estimatedHours, taskDuration);
        break;
      case WorkloadDistributionStrategy.BACK_LOADED:
        dailyHours = this.distributeBackLoaded(task.estimatedHours, taskDuration);
        break;
      case WorkloadDistributionStrategy.CUSTOM:
        dailyHours = customDistribution || this.distributeEvenly(task.estimatedHours, taskDuration);
        break;
      default:
        dailyHours = this.distributeEvenly(task.estimatedHours, taskDuration);
    }

    // Create workload entries for each day
    let currentDate = task.startDate;
    for (let i = 0; i < taskDuration && i < dailyHours.length; i++) {
      if (dailyHours[i] > 0) {
        const workloadEntry = await this.workloadService.allocateWorkload({
          userId: assigneeId,
          projectId: task.projectId,
          taskId: task.id,
          date: currentDate,
          allocatedHours: dailyHours[i]
        });
        workloadEntries.push(workloadEntry);
      }
      currentDate = addDays(currentDate, 1);
    }

    return workloadEntries;
  }

  /**
   * Distribute hours evenly across days
   */
  private distributeEvenly(totalHours: number, days: number): number[] {
    const hoursPerDay = totalHours / days;
    return Array(days).fill(hoursPerDay);
  }

  /**
   * Distribute hours with more at the beginning
   */
  private distributeFrontLoaded(totalHours: number, days: number): number[] {
    const distribution: number[] = [];
    let remainingHours = totalHours;
    
    for (let i = 0; i < days; i++) {
      const weight = (days - i) / days; // Higher weight for earlier days
      const hoursForDay = Math.min(remainingHours, (totalHours / days) * weight * 1.5);
      distribution.push(hoursForDay);
      remainingHours -= hoursForDay;
    }
    
    // Distribute any remaining hours evenly
    if (remainingHours > 0) {
      const additionalPerDay = remainingHours / days;
      for (let i = 0; i < days; i++) {
        distribution[i] += additionalPerDay;
      }
    }
    
    return distribution;
  }

  /**
   * Distribute hours with more at the end
   */
  private distributeBackLoaded(totalHours: number, days: number): number[] {
    const distribution: number[] = [];
    let remainingHours = totalHours;
    
    for (let i = 0; i < days; i++) {
      const weight = (i + 1) / days; // Higher weight for later days
      const hoursForDay = Math.min(remainingHours, (totalHours / days) * weight * 1.5);
      distribution.push(hoursForDay);
      remainingHours -= hoursForDay;
    }
    
    // Distribute any remaining hours evenly
    if (remainingHours > 0) {
      const additionalPerDay = remainingHours / days;
      for (let i = 0; i < days; i++) {
        distribution[i] += additionalPerDay;
      }
    }
    
    return distribution;
  }

  /**
   * Get basic assignment suggestions when task scheduling info is incomplete
   */
  private async getBasicAssignmentSuggestions(
    projectMembers: string[]
  ): Promise<AssignmentSuggestion[]> {
    const suggestions: AssignmentSuggestion[] = [];
    
    for (const userId of projectMembers) {
      try {
        const user = await this.userService.getUserProfile(userId);
        
        suggestions.push({
          userId,
          userName: user.name,
          currentCapacity: 0,
          availableCapacity: this.STANDARD_WEEKLY_CAPACITY,
          utilizationRate: 0,
          recommendationScore: 50, // Neutral score
          reason: 'Task scheduling information incomplete'
        });
      } catch (error) {
        console.warn(`Failed to get user info for ${userId}:`, error);
      }
    }
    
    return suggestions.sort((a, b) => a.userName.localeCompare(b.userName));
  }
}