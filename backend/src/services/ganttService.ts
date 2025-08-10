import { GanttTask, Task, TaskStatus } from '../../../shared/src/types';
import { TaskService } from './taskService';
import { UserService } from './userService';

export class GanttService {
  private taskService = new TaskService();
  private userService = new UserService();

  async getProjectGanttData(projectId: string, userId: string): Promise<GanttTask[]> {
    const tasks = await this.taskService.getProjectTasks(projectId, userId);

    const ganttTasks: GanttTask[] = [];

    for (const task of tasks) {
      let assigneeName = 'Unassigned';

      if (task.assigneeId) {
        try {
          const assignee = await this.userService.getUserProfile(task.assigneeId);
          assigneeName = assignee.name;
        } catch (error) {
          assigneeName = 'Unknown User';
        }
      }

      ganttTasks.push({
        id: task.id,
        name: task.title,
        start: task.startDate || new Date(),
        end: task.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week
        progress: this.calculateTaskProgress(task),
        dependencies: task.dependencies,
        assignee: assigneeName,
        projectId: task.projectId
      });
    }

    return ganttTasks;
  }

  async getMultiProjectGanttData(projectIds: string[], userId: string): Promise<GanttTask[]> {
    const allTasks: GanttTask[] = [];

    for (const projectId of projectIds) {
      try {
        const projectTasks = await this.getProjectGanttData(projectId, userId);
        allTasks.push(...projectTasks);
      } catch (error) {
        console.error(`Error getting Gantt data for project ${projectId}:`, error);
        // Continue with other projects
      }
    }

    return allTasks;
  }

  async updateTaskTimeline(
    taskId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<Task> {
    // Validate dependencies before updating
    const isValid = await this.validateDependencies(taskId, startDate);
    if (!isValid) {
      throw new Error('Timeline update would violate task dependencies');
    }

    // Update the task
    const updatedTask = await this.taskService.updateTask(taskId, {
      startDate,
      endDate
    }, userId);

    return updatedTask;
  }

  private calculateTaskProgress(task: Task): number {
    // Calculate progress based on task status
    switch (task.status) {
      case TaskStatus.TODO:
        return 0;
      case TaskStatus.IN_PROGRESS:
        return 50;
      case TaskStatus.IN_REVIEW:
        return 80;
      case TaskStatus.DONE:
        return 100;
      case TaskStatus.BLOCKED:
        return 25;
      default:
        return 0;
    }
  }

  private async validateDependencies(taskId: string, newStartDate: Date): Promise<boolean> {
    try {
      // Get the task to check its dependencies
      const task = await this.taskService.getTask(taskId, 'system'); // Use system user for validation

      // Check if any dependency tasks end after the new start date
      for (const depId of task.dependencies) {
        try {
          const depTask = await this.taskService.getTask(depId, 'system');
          if (depTask.endDate && depTask.endDate > newStartDate) {
            return false; // Dependency conflict
          }
        } catch (error) {
          // Dependency task might not exist anymore, continue
          continue;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating dependencies:', error);
      return false;
    }
  }
}