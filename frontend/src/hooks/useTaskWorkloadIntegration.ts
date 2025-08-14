import { useState, useEffect, useCallback } from 'react';
import {
  taskWorkloadService,
  AssignmentSuggestion,
  WorkloadImpact,
  CapacityInfo,
  WorkloadDistributionStrategy
} from '../services/taskWorkloadService';

export interface UseTaskWorkloadIntegrationOptions {
  taskId?: string;
  assigneeId?: string;
  projectMembers?: string[];
  autoLoadSuggestions?: boolean;
  autoLoadImpact?: boolean;
}

export const useTaskWorkloadIntegration = (options: UseTaskWorkloadIntegrationOptions = {}) => {
  const {
    taskId,
    assigneeId,
    projectMembers = [],
    autoLoadSuggestions = true,
    autoLoadImpact = true
  } = options;

  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [workloadImpact, setWorkloadImpact] = useState<WorkloadImpact | null>(null);
  const [capacities, setCapacities] = useState<CapacityInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load assignment suggestions
  const loadSuggestions = useCallback(async (forceReload = false) => {
    if (!taskId || (!forceReload && suggestions.length > 0)) return;

    setLoading(true);
    setError(null);

    try {
      const newSuggestions = await taskWorkloadService.getAssignmentSuggestions(taskId);
      setSuggestions(newSuggestions);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignment suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [taskId, suggestions.length]);

  // Load workload impact
  const loadWorkloadImpact = useCallback(async (forceReload = false) => {
    if (!taskId || !assigneeId || (!forceReload && workloadImpact)) return;

    setLoading(true);
    setError(null);

    try {
      const impact = await taskWorkloadService.getWorkloadImpact(taskId, assigneeId);
      setWorkloadImpact(impact);
    } catch (err: any) {
      setError(err.message || 'Failed to load workload impact');
      setWorkloadImpact(null);
    } finally {
      setLoading(false);
    }
  }, [taskId, assigneeId, workloadImpact]);

  // Load team capacities
  const loadTeamCapacities = useCallback(async (
    userIds: string[] = projectMembers,
    startDate?: Date,
    endDate?: Date,
    forceReload = false
  ) => {
    if (userIds.length === 0 || (!forceReload && capacities.length > 0)) return;

    setLoading(true);
    setError(null);

    try {
      const newCapacities = await taskWorkloadService.getMultipleUserCapacities(
        userIds,
        startDate,
        endDate
      );
      setCapacities(newCapacities);
    } catch (err: any) {
      setError(err.message || 'Failed to load team capacities');
      setCapacities([]);
    } finally {
      setLoading(false);
    }
  }, [projectMembers, capacities.length]);

  // Assign task with workload
  const assignTaskWithWorkload = useCallback(async (
    assigneeId: string,
    options: {
      distributionStrategy?: WorkloadDistributionStrategy;
      customDistribution?: number[];
      autoAllocate?: boolean;
    } = {}
  ) => {
    if (!taskId) throw new Error('Task ID is required');

    setLoading(true);
    setError(null);

    try {
      const result = await taskWorkloadService.assignTaskWithWorkload(taskId, {
        assigneeId,
        ...options
      });
      
      // Refresh data after assignment
      await Promise.all([
        loadSuggestions(true),
        loadWorkloadImpact(true),
        loadTeamCapacities(projectMembers, undefined, undefined, true)
      ]);

      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to assign task with workload');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [taskId, loadSuggestions, loadWorkloadImpact, loadTeamCapacities, projectMembers]);

  // Validate assignment
  const validateAssignment = useCallback(async (assigneeId: string) => {
    if (!taskId) throw new Error('Task ID is required');

    try {
      return await taskWorkloadService.validateAssignment(taskId, assigneeId);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to validate assignment');
    }
  }, [taskId]);

  // Get optimal assignees
  const getOptimalAssignees = useCallback(async (maxSuggestions = 3) => {
    if (!taskId) return [];

    try {
      return await taskWorkloadService.getOptimalAssignees(taskId, maxSuggestions);
    } catch (err: any) {
      console.warn('Failed to get optimal assignees:', err);
      return [];
    }
  }, [taskId]);

  // Auto-load data when dependencies change
  useEffect(() => {
    if (autoLoadSuggestions && taskId) {
      loadSuggestions();
    }
  }, [taskId, autoLoadSuggestions, loadSuggestions]);

  useEffect(() => {
    if (autoLoadImpact && taskId && assigneeId) {
      loadWorkloadImpact();
    }
  }, [taskId, assigneeId, autoLoadImpact, loadWorkloadImpact]);

  useEffect(() => {
    if (projectMembers.length > 0) {
      loadTeamCapacities();
    }
  }, [projectMembers, loadTeamCapacities]);

  // Helper functions
  const getSuggestionForUser = useCallback((userId: string) => {
    return suggestions.find(s => s.userId === userId);
  }, [suggestions]);

  const getCapacityForUser = useCallback((userId: string) => {
    return capacities.find(c => c.userId === userId);
  }, [capacities]);

  const isUserOverAllocated = useCallback((userId: string) => {
    const capacity = getCapacityForUser(userId);
    return capacity?.isOverAllocated || false;
  }, [getCapacityForUser]);

  const getUserUtilization = useCallback((userId: string) => {
    const capacity = getCapacityForUser(userId);
    return capacity?.utilizationRate || 0;
  }, [getCapacityForUser]);

  // Team overview
  const teamOverview = {
    totalMembers: capacities.length,
    overAllocatedMembers: capacities.filter(c => c.isOverAllocated).length,
    averageUtilization: capacities.length > 0 
      ? capacities.reduce((sum, c) => sum + c.utilizationRate, 0) / capacities.length 
      : 0,
    totalCapacity: capacities.reduce((sum, c) => sum + c.totalCapacity, 0),
    totalAllocated: capacities.reduce((sum, c) => sum + c.allocatedHours, 0),
    totalAvailable: capacities.reduce((sum, c) => sum + c.availableHours, 0)
  };

  return {
    // Data
    suggestions,
    workloadImpact,
    capacities,
    teamOverview,
    
    // State
    loading,
    error,
    
    // Actions
    loadSuggestions,
    loadWorkloadImpact,
    loadTeamCapacities,
    assignTaskWithWorkload,
    validateAssignment,
    getOptimalAssignees,
    
    // Helpers
    getSuggestionForUser,
    getCapacityForUser,
    isUserOverAllocated,
    getUserUtilization,
    
    // Clear functions
    clearError: () => setError(null),
    clearData: () => {
      setSuggestions([]);
      setWorkloadImpact(null);
      setCapacities([]);
      setError(null);
    }
  };
};