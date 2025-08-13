import { useState, useEffect } from 'react';
import { Task, User } from '@task-manager/shared';
import { userService } from '../services/userService';

export interface TaskWithAssignee extends Task {
  assignee?: User;
}

export const useTasksWithAssignees = (tasks: Task[]) => {
  const [tasksWithAssignees, setTasksWithAssignees] = useState<TaskWithAssignee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAssignees = async () => {
      if (tasks.length === 0) {
        setTasksWithAssignees([]);
        return;
      }

      setLoading(true);
      
      try {
        // Collect unique user IDs
        const uniqueUserIds = new Set<string>();
        tasks.forEach(task => {
          if (task.assigneeId) {
            uniqueUserIds.add(task.assigneeId);
          }
        });

        // Load user details for all unique assignees
        const userMap = new Map<string, User>();
        
        for (const userId of Array.from(uniqueUserIds)) {
          try {
            const user = await userService.getUser(userId);
            userMap.set(userId, user);
          } catch (err) {
            console.warn(`Failed to load user ${userId}:`, err);
          }
        }

        // Convert tasks to TaskWithAssignee format with populated assignee data
        const enrichedTasks: TaskWithAssignee[] = tasks.map(task => ({
          ...task,
          assignee: task.assigneeId ? userMap.get(task.assigneeId) : undefined
        }));

        setTasksWithAssignees(enrichedTasks);
      } catch (err) {
        console.error('Failed to load assignees:', err);
        // Fallback to tasks without assignee data
        setTasksWithAssignees(tasks.map(task => ({ ...task, assignee: undefined })));
      } finally {
        setLoading(false);
      }
    };

    loadAssignees();
  }, [tasks]);

  return { tasksWithAssignees, loading };
};