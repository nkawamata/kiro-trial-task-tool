import React, { useMemo } from 'react';
import { Box, Typography, Chip, Avatar } from '@mui/material';
import { Task, Project, TaskStatus, TaskPriority, GanttTask } from '@task-manager/shared';
import { TaskWithAssignee } from '../../hooks/useTasksWithAssignees';
import { GanttTimeline } from './GanttTimeline';

interface GanttChartViewProps {
  tasks: TaskWithAssignee[];
  projects: Project[];
  viewMode: 'day' | 'week' | 'month' | 'quarter';
  selectedUserId?: string;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export const GanttChartView: React.FC<GanttChartViewProps> = ({
  tasks,
  projects,
  viewMode,
  selectedUserId,
  onTaskClick,
  onTaskUpdate
}) => {
  // Convert tasks to Gantt format
  const ganttTasks = useMemo(() => {
    return tasks
      .filter(task => task.startDate && task.endDate) // Only show tasks with dates
      .map((task): GanttTask => {
        // Calculate progress based on status
        let progress = 0;
        switch (task.status) {
          case TaskStatus.TODO:
            progress = 0;
            break;
          case TaskStatus.IN_PROGRESS:
            progress = 50;
            break;
          case TaskStatus.IN_REVIEW:
            progress = 80;
            break;
          case TaskStatus.DONE:
            progress = 100;
            break;
          case TaskStatus.BLOCKED:
            progress = 25;
            break;
        }

        // Parse dates carefully to handle JST timezone
        const parseTaskDate = (dateStr: string | Date) => {
          if (dateStr instanceof Date) return dateStr;
          
          // If it's an ISO string with timezone, parse it normally
          if (typeof dateStr === 'string' && dateStr.includes('T')) {
            return new Date(dateStr);
          }
          
          // If it's a date-only string (YYYY-MM-DD), treat it as local date
          if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day); // month is 0-indexed
          }
          
          // Fallback to normal parsing
          return new Date(dateStr);
        };

        return {
          id: task.id,
          name: task.title,
          start: parseTaskDate(task.startDate!),
          end: parseTaskDate(task.endDate!),
          progress,
          dependencies: task.dependencies || [],
          assignee: task.assignee?.name || task.assignee?.email || task.assigneeId,
          projectId: task.projectId
        };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime()); // Sort by start date
  }, [tasks]);

  // Group tasks by project for better organization
  const tasksByProject = useMemo(() => {
    const grouped = ganttTasks.reduce((acc, task) => {
      if (!acc[task.projectId]) {
        acc[task.projectId] = [];
      }
      acc[task.projectId].push(task);
      return acc;
    }, {} as Record<string, GanttTask[]>);

    return grouped;
  }, [ganttTasks]);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getTaskColor = (task: GanttTask) => {
    const originalTask = tasks.find(t => t.id === task.id);
    if (!originalTask) return '#1976d2';

    switch (originalTask.priority) {
      case TaskPriority.URGENT:
        return '#d32f2f';
      case TaskPriority.HIGH:
        return '#f57c00';
      case TaskPriority.MEDIUM:
        return '#1976d2';
      case TaskPriority.LOW:
        return '#388e3c';
      default:
        return '#1976d2';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'default';
      case TaskStatus.IN_PROGRESS: return 'primary';
      case TaskStatus.IN_REVIEW: return 'warning';
      case TaskStatus.DONE: return 'success';
      case TaskStatus.BLOCKED: return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW: return 'success';
      case TaskPriority.MEDIUM: return 'info';
      case TaskPriority.HIGH: return 'warning';
      case TaskPriority.URGENT: return 'error';
      default: return 'default';
    }
  };

  if (ganttTasks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No tasks with start and end dates found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Tasks need both start and end dates to appear in the Gantt chart
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '600px', width: '100%' }}>
      {/* Task List Sidebar */}
      <Box sx={{ display: 'flex', height: '100%' }}>
        <Box sx={{ 
          width: '300px', 
          borderRight: '1px solid #e0e0e0', 
          overflow: 'auto',
          backgroundColor: '#fafafa'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: 'white' }}>
            <Typography variant="h6">Tasks</Typography>
          </Box>
          
          {Object.entries(tasksByProject).map(([projectId, projectTasks]) => (
            <Box key={projectId} sx={{ mb: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                backgroundColor: 'white', 
                borderBottom: '1px solid #e0e0e0',
                fontWeight: 'bold'
              }}>
                <Typography variant="subtitle2" color="primary">
                  {getProjectName(projectId)} ({projectTasks.length})
                </Typography>
              </Box>
              
              {projectTasks.map((ganttTask) => {
                const originalTask = tasks.find(t => t.id === ganttTask.id);
                return (
                  <Box
                    key={ganttTask.id}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      backgroundColor: selectedUserId && (
                        (selectedUserId === 'unassigned' && !originalTask?.assigneeId) ||
                        (selectedUserId === originalTask?.assigneeId)
                      ) ? '#e3f2fd' : 'transparent',
                      borderLeft: selectedUserId && (
                        (selectedUserId === 'unassigned' && !originalTask?.assigneeId) ||
                        (selectedUserId === originalTask?.assigneeId)
                      ) ? '3px solid #1976d2' : 'none',
                      '&:hover': {
                        backgroundColor: selectedUserId && (
                          (selectedUserId === 'unassigned' && !originalTask?.assigneeId) ||
                          (selectedUserId === originalTask?.assigneeId)
                        ) ? '#bbdefb' : '#f5f5f5'
                      }
                    }}
                    onClick={() => onTaskClick(ganttTask.id)}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {ganttTask.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      {originalTask && (
                        <>
                          <Chip
                            label={originalTask.status.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(originalTask.status) as any}
                            variant="outlined"
                          />
                          <Chip
                            label={originalTask.priority}
                            size="small"
                            color={getPriorityColor(originalTask.priority) as any}
                            variant="outlined"
                          />
                        </>
                      )}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      {ganttTask.start.toLocaleDateString()} - {ganttTask.end.toLocaleDateString()}
                    </Typography>
                    
                    {ganttTask.assignee && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                          {ganttTask.assignee.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {ganttTask.assignee}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {/* Timeline View */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <GanttTimeline
            tasks={ganttTasks}
            viewMode={viewMode}
            selectedUserId={selectedUserId}
            onTaskClick={onTaskClick}
            onTaskUpdate={onTaskUpdate}
            getTaskColor={getTaskColor}
          />
        </Box>
      </Box>
    </Box>
  );
};