import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link,
  Container,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon,
  Home as HomeIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';
import { TaskCreateForm, TaskCreateData, ProjectMemberWithUser } from '../components/tasks';
import { NavigationGuard } from '../components/common';
import { RootState, AppDispatch } from '../store';
import { fetchProjects } from '../store/slices/projectsSlice';
import { teamService } from '../services/teamService';
import { taskService } from '../services/taskService';
import { Task } from '@task-manager/shared';

export const TaskEditPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { taskId } = useParams<{ taskId: string }>();
  
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  
  const [task, setTask] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberWithUser[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

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
      
      // Load project data
      await handleProjectChange(taskData.projectId);
    } catch (err: any) {
      setError(err.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = async (projectId: string) => {
    if (!projectId) return;

    try {
      const [members, tasks] = await Promise.all([
        teamService.getProjectMembers(projectId),
        taskService.getProjectTasks(projectId)
      ]);
      
      setProjectMembers(members);
      setAvailableTasks(tasks.filter(t => t.id !== taskId)); // Exclude current task
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  };

  const handleSubmit = async (data: TaskCreateData) => {
    if (!taskId) return;
    
    setSubmitting(true);
    try {
      await taskService.updateTask(taskId, data);
      navigate(`/projects/${data.projectId}`);
    } catch (error: any) {
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmed) return;
    }

    if (task) {
      navigate(`/projects/${task.projectId}`);
    } else {
      navigate('/tasks');
    }
  };

  if (loading || projectsLoading) {
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

  const initialData: TaskCreateData = {
    title: task.title,
    description: task.description || '',
    projectId: task.projectId,
    assigneeId: task.assigneeId,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate ? new Date(task.startDate) : undefined,
    endDate: task.endDate ? new Date(task.endDate) : undefined,
    estimatedHours: task.estimatedHours,
    dependencies: task.dependencies || []
  };

  return (
    <>
      <NavigationGuard
        hasUnsavedChanges={hasUnsavedChanges}
        message="You have unsaved task changes. Are you sure you want to leave this page?"
        onConfirmNavigation={() => setHasUnsavedChanges(false)}
      />
      
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
            <EditIcon fontSize="small" />
            Edit Task
          </Typography>
        </Breadcrumbs>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
            <EditIcon />
            Edit Task
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Update the task details below.
          </Typography>
        </Box>

        <Paper elevation={1} sx={{ p: 4, borderRadius: 2 }}>
          <TaskCreateForm
            initialData={initialData}
            projects={projects}
            projectMembers={projectMembers}
            availableTasks={availableTasks}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onProjectChange={handleProjectChange}
            onUnsavedChanges={setHasUnsavedChanges}
            loading={submitting}
            isEditMode
          />
        </Paper>
      </Container>
    </>
  );
};