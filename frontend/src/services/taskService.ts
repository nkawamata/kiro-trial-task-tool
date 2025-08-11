import { Task, TaskStatus, TaskPriority } from '@task-manager/shared';
import { apiClient } from './apiClient';
import { TaskCreateData } from '../components/tasks';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  estimatedHours?: number;
}

export interface TasksResponse {
  tasks: Task[];
}

export interface TaskResponse {
  task: Task;
}

export const taskService = {
  async createTask(data: TaskCreateData): Promise<Task> {
    const requestData: CreateTaskRequest = {
      title: data.title,
      description: data.description || undefined,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate?.toISOString(),
      endDate: data.endDate?.toISOString(),
      estimatedHours: data.estimatedHours
    };

    const response = await apiClient.post<TaskResponse>('/tasks', requestData);
    return response.data.task;
  },

  async getProjectTasks(projectId: string): Promise<Task[]> {
    const response = await apiClient.get<TasksResponse>(`/tasks/project/${projectId}`);
    return response.data.tasks;
  },

  async getUserTasks(): Promise<Task[]> {
    const response = await apiClient.get<TasksResponse>('/tasks/user');
    return response.data.tasks;
  },

  async getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get<TaskResponse>(`/tasks/${taskId}`);
    return response.data.task;
  },

  async updateTask(taskId: string, updates: Partial<TaskCreateData>): Promise<Task> {
    const requestData: Partial<CreateTaskRequest> = {
      ...updates,
      startDate: updates.startDate?.toISOString(),
      endDate: updates.endDate?.toISOString()
    };

    const response = await apiClient.put<TaskResponse>(`/tasks/${taskId}`, requestData);
    return response.data.task;
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  }
};