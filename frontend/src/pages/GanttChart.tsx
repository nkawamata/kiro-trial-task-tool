import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Add as AddIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProjectTasks } from '../store/slices/tasksSlice';
import { fetchProjects } from '../store/slices/projectsSlice';
import { GanttChartView } from '../components/gantt/GanttChartView';
import { useTasksWithAssignees } from '../hooks/useTasksWithAssignees';
import { TaskStatus, TaskPriority } from '@task-manager/shared';

type ViewMode = 'day' | 'week' | 'month' | 'quarter';

export const GanttChart: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || 'all');
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Use the hook to enrich tasks with assignee data
  const { tasksWithAssignees, loading: assigneesLoading } = useTasksWithAssignees(tasks);

  // Filter tasks based on selected project and filters
  const filteredTasks = useMemo(() => {
    let filtered = tasksWithAssignees;

    // Filter by project
    if (selectedProjectId !== 'all') {
      filtered = filtered.filter(task => task.projectId === selectedProjectId);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    return filtered;
  }, [tasksWithAssignees, selectedProjectId, statusFilter, priorityFilter]);

  // Get project name for display
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProjectId === 'all') {
      // Fetch tasks for all projects
      projects.forEach(project => {
        dispatch(fetchProjectTasks(project.id));
      });
    } else {
      dispatch(fetchProjectTasks(selectedProjectId));
    }
  }, [dispatch, selectedProjectId, projects]);

  const handleCreateTask = () => {
    const queryParams = selectedProjectId !== 'all' ? `?projectId=${selectedProjectId}` : '';
    navigate(`/tasks/create${queryParams}`);
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (projectId !== 'all') {
      navigate(`/gantt/${projectId}`);
    } else {
      navigate('/gantt');
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

  if (projectsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Loading projects...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon />
          Gantt Chart
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
        >
          New Task
        </Button>
      </Box>

      {/* Filters and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Project Selection */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProjectId}
                label="Project"
                onChange={(e) => handleProjectChange(e.target.value)}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* View Mode */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>View</InputLabel>
              <Select
                value={viewMode}
                label="View"
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="quarter">Quarter</MenuItem>
              </Select>
            </FormControl>

            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value={TaskStatus.TODO}>To Do</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.IN_REVIEW}>In Review</MenuItem>
                <MenuItem value={TaskStatus.DONE}>Done</MenuItem>
                <MenuItem value={TaskStatus.BLOCKED}>Blocked</MenuItem>
              </Select>
            </FormControl>

            {/* Priority Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              >
                <MenuItem value="all">All Priority</MenuItem>
                <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
                <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                <MenuItem value={TaskPriority.URGENT}>Urgent</MenuItem>
              </Select>
            </FormControl>

            {/* Quick Actions */}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Tooltip title="Zoom to Today">
                <IconButton size="small">
                  <TodayIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom In">
                <IconButton size="small">
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton size="small">
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Active Filters Display */}
          {(statusFilter !== 'all' || priorityFilter !== 'all' || selectedProjectId !== 'all') && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Active filters:
              </Typography>
              {selectedProjectId !== 'all' && (
                <Chip
                  label={`Project: ${getProjectName(selectedProjectId)}`}
                  size="small"
                  onDelete={() => handleProjectChange('all')}
                />
              )}
              {statusFilter !== 'all' && (
                <Chip
                  label={`Status: ${statusFilter.replace('_', ' ')}`}
                  size="small"
                  color={getStatusColor(statusFilter) as any}
                  onDelete={() => setStatusFilter('all')}
                />
              )}
              {priorityFilter !== 'all' && (
                <Chip
                  label={`Priority: ${priorityFilter}`}
                  size="small"
                  color={getPriorityColor(priorityFilter) as any}
                  onDelete={() => setPriorityFilter('all')}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {(tasksLoading || assigneesLoading) ? (
            <Box sx={{ p: 3 }}>
              <Typography>Loading tasks...</Typography>
            </Box>
          ) : filteredTasks.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Alert severity="info">
                No tasks found with the current filters. 
                {selectedProjectId !== 'all' ? ' Try selecting a different project or ' : ' '}
                <Button 
                  variant="text" 
                  onClick={handleCreateTask}
                  sx={{ textTransform: 'none' }}
                >
                  create a new task
                </Button>
                .
              </Alert>
            </Box>
          ) : (
            <GanttChartView
              tasks={filteredTasks}
              projects={projects}
              viewMode={viewMode}
              onTaskClick={handleTaskClick}
              onTaskUpdate={(taskId, updates) => {
                // Handle task updates from the Gantt chart
                console.log('Task update:', taskId, updates);
              }}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};