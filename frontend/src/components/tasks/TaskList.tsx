import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Grid,
  Divider,
  Button
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Flag as PriorityIcon,
  Assignment as TaskIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Task, TaskStatus, TaskPriority, User } from '@task-manager/shared';

interface TaskWithAssignee extends Task {
  assignee?: User;
}

interface TaskListProps {
  tasks: TaskWithAssignee[];
  onTaskClick: (taskId: string) => void;
  onTaskMenuClick: (event: React.MouseEvent<HTMLElement>, task: TaskWithAssignee) => void;
  getProjectName: (projectId: string) => string;
  loading?: boolean;
  onCreateTask?: () => void;
  hasFilters?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskClick,
  onTaskMenuClick,
  getProjectName,
  loading = false,
  onCreateTask,
  hasFilters = false
}) => {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'default';
      case TaskStatus.IN_PROGRESS:
        return 'info';
      case TaskStatus.IN_REVIEW:
        return 'warning';
      case TaskStatus.DONE:
        return 'success';
      case TaskStatus.BLOCKED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'success';
      case TaskPriority.MEDIUM:
        return 'info';
      case TaskPriority.HIGH:
        return 'warning';
      case TaskPriority.URGENT:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const isOverdue = (task: TaskWithAssignee) => {
    if (!task.endDate || task.status === TaskStatus.DONE) return false;
    return new Date(task.endDate) < new Date();
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading tasks...
        </Typography>
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {hasFilters ? 'No tasks match your filters' : 'No tasks found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {hasFilters 
              ? 'Try adjusting your search criteria or filters'
              : 'Get started by creating your first task'
            }
          </Typography>
          {onCreateTask && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateTask}
            >
              Create Task
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid item xs={12} sm={6} lg={4} key={task.id}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              },
              border: isOverdue(task) ? '2px solid' : '1px solid',
              borderColor: isOverdue(task) ? 'error.main' : 'divider'
            }}
            onClick={() => onTaskClick(task.id)}
          >
            <CardContent>
              {/* Task Header */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: 0.5
                    }}
                  >
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {getProjectName(task.projectId)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => onTaskMenuClick(e, task)}
                  sx={{ ml: 1 }}
                >
                  <MoreIcon />
                </IconButton>
              </Box>

              {/* Task Description */}
              {task.description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {task.description}
                </Typography>
              )}

              {/* Status and Priority */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={getStatusLabel(task.status)}
                  size="small"
                  color={getStatusColor(task.status) as any}
                  variant="filled"
                />
                <Chip
                  label={getPriorityLabel(task.priority)}
                  size="small"
                  color={getPriorityColor(task.priority) as any}
                  variant="outlined"
                  icon={<PriorityIcon />}
                />
                {isOverdue(task) && (
                  <Chip
                    label="Overdue"
                    size="small"
                    color="error"
                    variant="filled"
                  />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Task Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Assignee */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  {task.assigneeId ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                        {task.assigneeId.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">
                        {task.assignee?.name || 'Assigned'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Unassigned
                    </Typography>
                  )}
                </Box>

                {/* Dates */}
                {(task.startDate || task.endDate) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {task.startDate && new Date(task.startDate).toLocaleDateString()}
                      {task.startDate && task.endDate && ' - '}
                      {task.endDate && new Date(task.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {/* Estimated Hours */}
                {task.estimatedHours && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {task.estimatedHours}h estimated
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};