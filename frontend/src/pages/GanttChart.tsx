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
  Today as TodayIcon,
  Person as PersonIcon
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
  const [userFilter, setUserFilter] = useState<string | 'all'>('all');

  // Use the hook to enrich tasks with assignee data
  const { tasksWithAssignees, loading: assigneesLoading } = useTasksWithAssignees(tasks);

  // Get unique users from tasks for filter dropdown
  const availableUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string; email: string }>();

    tasksWithAssignees.forEach(task => {
      if (task.assignee) {
        userMap.set(task.assignee.id, {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email
        });
      }
    });

    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasksWithAssignees]);

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

    // Filter by user/assignee
    if (userFilter !== 'all') {
      if (userFilter === 'unassigned') {
        filtered = filtered.filter(task => !task.assigneeId);
      } else {
        filtered = filtered.filter(task => task.assigneeId === userFilter);
      }
    }

    return filtered;
  }, [tasksWithAssignees, selectedProjectId, statusFilter, priorityFilter, userFilter]);

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

            {/* User/Assignee Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon fontSize="small" />
                  Assignee
                </Box>
              </InputLabel>
              <Select
                value={userFilter}
                label="Assignee"
                onChange={(e) => setUserFilter(e.target.value as string)}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    All Users
                  </Box>
                </MenuItem>
                <MenuItem value="unassigned">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="disabled" />
                    Unassigned
                  </Box>
                </MenuItem>
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="primary" />
                      {user.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Quick Actions - These will be handled by the GanttTimeline component */}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Tooltip title="Timeline navigation available in chart">
                <IconButton size="small" disabled>
                  <TodayIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Active Filters Display */}
          {(statusFilter !== 'all' || priorityFilter !== 'all' || selectedProjectId !== 'all' || userFilter !== 'all') && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
              {userFilter !== 'all' && (
                <Chip
                  label={`Assignee: ${userFilter === 'unassigned' ? 'Unassigned' : availableUsers.find(u => u.id === userFilter)?.name || 'Unknown'}`}
                  size="small"
                  color="info"
                  onDelete={() => setUserFilter('all')}
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
              selectedUserId={userFilter !== 'all' ? userFilter : undefined}
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