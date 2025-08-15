import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ProjectStatus, TaskStatus } from '@task-manager/shared';

export interface DashboardStats {
  activeProjects: number;
  totalProjects: number;
  tasksDueToday: number;
  tasksInProgress: number;
  completedTasks: number;
  overdueTasks: number;
  totalTasks: number;
}

export const useDashboardStats = (): DashboardStats => {
  const { projects } = useSelector((state: RootState) => state.projects);
  const { tasks } = useSelector((state: RootState) => state.tasks);

  return useMemo(() => {
    // Ensure we have arrays to work with
    const projectList = projects || [];
    const taskList = tasks || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Project stats
    const activeProjects = projectList.filter(p => p.status === ProjectStatus.ACTIVE).length;
    const totalProjects = projectList.length;

    // Task stats
    const tasksDueToday = taskList.filter(task => {
      if (!task.endDate) return false;
      const taskEndDate = new Date(task.endDate);
      taskEndDate.setHours(0, 0, 0, 0);
      return taskEndDate.getTime() === today.getTime() && task.status !== TaskStatus.DONE;
    }).length;

    const tasksInProgress = taskList.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const completedTasks = taskList.filter(task => task.status === TaskStatus.DONE).length;
    
    const overdueTasks = taskList.filter(task => {
      if (!task.endDate || task.status === TaskStatus.DONE) return false;
      const taskEndDate = new Date(task.endDate);
      taskEndDate.setHours(23, 59, 59, 999);
      return taskEndDate < today;
    }).length;

    const totalTasks = taskList.length;

    return {
      activeProjects,
      totalProjects,
      tasksDueToday,
      tasksInProgress,
      completedTasks,
      overdueTasks,
      totalTasks,
    };
  }, [projects, tasks]);
};