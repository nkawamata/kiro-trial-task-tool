import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Grid,
  Divider
} from '@mui/material';
import { 
  Assignment as TaskIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { TaskComments, TaskAllocation } from '../components/tasks';
import { Task, TaskStatus, TaskPriority, User } from '@task-manager/shared';

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO: return 'default';
    case TaskStatus.IN_PROGRESS: return 'info';
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

export const TaskDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  
  const [task, setTask] = useState<Task | null>(null);
  const [assignee, setAssignee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const taskData = await taskService.getTask(taskId);
      setTask(taskData);
      
      // Load assignee details if task has an assignee
      if (taskData.assigneeId) {
        try {
          const assigneeData = await userService.getUser(taskData.assigneeId);
          setAssignee(assigneeData);
        } catch (err) {
          console.warn('Failed to load assignee details:', err);
          // Don't fail the whole page if assignee loading fails
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/tasks/${taskId}/edit`);
  };

  const handleDelete = async () => {
    if (!taskId || !task) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;
    
    setDeleting(true);
    try {
      await taskService.deleteTask(taskId);
      navigate(`/projects/${task.projectId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !task) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">
          {error || 'Task not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <HomeIcon fontSize="small" />
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/tasks')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <TaskIcon fontSize="small" />
          Tasks
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TaskIcon fontSize="small" />
          Task Details
        </Typography>
      </Breadcrumbs>

      <Paper elevation={1} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flex: 1 }}>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              size="small"
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={deleting}
              size="small"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FlagIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">Status</Typography>
            </Box>
            <Chip 
              label={task.status.replace('_', ' ').toUpperCase()} 
              color={getStatusColor(task.status)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FlagIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">Priority</Typography>
            </Box>
            <Chip 
              label={task.priority.toUpperCase()} 
              color={getPriorityColor(task.priority)}
              variant="outlined"
              size="small"
            />
          </Grid>

          {task.assigneeId && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon fontSize="small" />
                <Typography variant="body2" color="text.secondary">Assignee</Typography>
              </Box>
              <Typography variant="body1">
                {assignee ? assignee.name || assignee.email : task.assigneeId}
              </Typography>
            </Grid>
          )}

          {(task.startDate || task.endDate) && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ScheduleIcon fontSize="small" />
                <Typography variant="body2" color="text.secondary">Timeline</Typography>
              </Box>
              <Typography variant="body1">
                {task.startDate && new Date(task.startDate).toLocaleDateString()}
                {task.startDate && task.endDate && ' - '}
                {task.endDate && new Date(task.endDate).toLocaleDateString()}
              </Typography>
            </Grid>
          )}

          {task.estimatedHours && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ScheduleIcon fontSize="small" />
                <Typography variant="body2" color="text.secondary">Estimated Hours</Typography>
              </Box>
              <Typography variant="body1">{task.estimatedHours}h</Typography>
            </Grid>
          )}

          {task.description && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {task.description}
                </Typography>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Created: {new Date(task.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updated: {new Date(task.updatedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Task Allocation Section */}
      <Paper elevation={1} sx={{ p: 4, borderRadius: 2, mt: 3 }}>
        <TaskAllocation taskId={task.id} assigneeId={task.assigneeId} assignee={assignee || undefined} />
      </Paper>

      {/* Comments Section */}
      <Paper elevation={1} sx={{ p: 4, borderRadius: 2, mt: 3 }}>
        <TaskComments taskId={task.id} />
      </Paper>
    </Container>
  );
};