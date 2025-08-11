import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProjects } from '../store/slices/projectsSlice';
import { taskService } from '../services/taskService';
import { TaskList, TaskFiltersComponent, TaskFilters } from '../components/tasks';
import { Task, TaskStatus, TaskPriority, User } from '@task-manager/shared';

interface TaskWithAssignee extends Task {
  assignee?: User;
}

export const TaskManagement: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { projects } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(null);

  
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    projectId: 'all',
    assignedToMe: false
  });

  // Load projects on component mount
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Load tasks when projects are available
  useEffect(() => {
    if (projects.length > 0) {
      loadTasks();
    }
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all tasks across all projects the user has access to
      // Since there's no direct endpoint for this, we'll get tasks from all user's projects
      const userProjects = projects;
      
      const allTasks: Task[] = [];
      const uniqueUserIds = new Set<string>();
      
      // Get tasks from all projects
      for (const project of userProjects) {
        try {
          const projectTasks = await taskService.getProjectTasks(project.id);
          allTasks.push(...projectTasks);
          
          // Collect unique user IDs for assignees
          projectTasks.forEach(task => {
            if (task.assigneeId) {
              uniqueUserIds.add(task.assigneeId);
            }
          });
        } catch (err) {
          console.warn(`Failed to load tasks for project ${project.name}:`, err);
        }
      }
      
      // For now, we'll skip loading individual users since we don't have a direct endpoint
      // In a real implementation, you'd want to batch load users or have the backend return populated data
      
      // Convert tasks to TaskWithAssignee format
      const tasksWithAssignees: TaskWithAssignee[] = allTasks.map(task => ({
        ...task,
        assignee: undefined // We'll populate this later when we have user loading
      }));
      
      setTasks(tasksWithAssignees);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    navigate('/tasks/create');
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleEditTask = (taskId: string) => {
    navigate(`/tasks/${taskId}/edit`);
    setAnchorEl(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setAnchorEl(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, task: TaskWithAssignee) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !task.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // Priority filter
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    // Project filter
    if (filters.projectId !== 'all' && task.projectId !== filters.projectId) {
      return false;
    }

    // Assigned to me filter
    if (filters.assignedToMe && task.assigneeId !== user?.id) {
      return false;
    }

    return true;
  });

  // Sort tasks by priority and due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First by status (incomplete tasks first)
    const aComplete = a.status === TaskStatus.DONE;
    const bComplete = b.status === TaskStatus.DONE;
    if (aComplete !== bComplete) {
      return aComplete ? 1 : -1;
    }

    // Then by priority
    const priorityOrder = {
      [TaskPriority.URGENT]: 0,
      [TaskPriority.HIGH]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 3
    };
    const priorityComparison = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityComparison !== 0) return priorityComparison;

    // Then by due date (earliest first)
    if (a.endDate && b.endDate) {
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
    if (a.endDate && !b.endDate) return -1;
    if (!a.endDate && b.endDate) return 1;

    // Finally by title
    return a.title.localeCompare(b.title);
  });

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TaskIcon />
          <Typography variant="h4" component="h1">
            Tasks
          </Typography>
          <Chip 
            label={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
          sx={{ minWidth: 140 }}
        >
          Create Task
        </Button>
      </Box>

      {/* Filters */}
      <TaskFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        projects={projects}
        loading={loading}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Tasks List */}
      <TaskList
        tasks={sortedTasks}
        onTaskClick={handleTaskClick}
        onTaskMenuClick={handleMenuClick}
        getProjectName={getProjectName}
        loading={loading}
        onCreateTask={handleCreateTask}
        hasFilters={filters.search !== '' || filters.status !== 'all' || filters.priority !== 'all' || 
                   filters.projectId !== 'all' || filters.assignedToMe}
      />

      {/* Task Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => selectedTask && handleEditTask(selectedTask.id)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Task
        </MenuItem>
        <MenuItem 
          onClick={() => selectedTask && handleDeleteTask(selectedTask.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Task
        </MenuItem>
      </Menu>
    </Box>
  );
};