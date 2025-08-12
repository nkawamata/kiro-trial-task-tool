import { WorkloadSummary, WorkloadEntry } from '@task-manager/shared';
import { apiClient } from './apiClient';

export interface WorkloadAllocationRequest {
  userId: string;
  projectId: string;
  taskId: string;
  allocatedHours: number;
  date: string;
  actualHours?: number;
}

export interface WorkloadDistribution {
  userId: string;
  totalCapacity: number;
  allocated: number;
  available: number;
  projects: {
    projectId: string;
    name: string;
    percentage: number;
    hours: number;
  }[];
}

export class WorkloadService {
  static async getUserWorkloadSummary(startDate: string, endDate: string): Promise<WorkloadSummary> {
    const response = await apiClient.get('/workload/summary', {
      params: { startDate, endDate }
    });
    return response.data.summary;
  }

  static async getTeamWorkload(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkloadSummary[]> {
    const response = await apiClient.get('/workload/team', {
      params: { projectId, startDate, endDate }
    });
    return response.data.workload;
  }

  static async getWorkloadDistribution(): Promise<WorkloadDistribution> {
    const response = await apiClient.get('/workload/distribution');
    return response.data.distribution;
  }

  static async allocateWorkload(allocation: WorkloadAllocationRequest): Promise<WorkloadEntry> {
    const response = await apiClient.post('/workload/allocate', allocation);
    return response.data.allocation;
  }

  static async updateWorkloadActualHours(
    workloadId: string,
    actualHours: number
  ): Promise<WorkloadEntry> {
    const response = await apiClient.patch(`/workload/${workloadId}`, {
      actualHours
    });
    return response.data.workload;
  }

  static async getWorkloadByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkloadEntry[]> {
    const response = await apiClient.get('/workload/entries', {
      params: { userId, startDate, endDate }
    });
    return response.data.entries;
  }

  static async deleteWorkloadAllocation(workloadId: string): Promise<void> {
    await apiClient.delete(`/workload/${workloadId}`);
  }
}

export default WorkloadService;