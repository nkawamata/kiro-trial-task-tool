import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link,
  Container,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon,
  Home as HomeIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';
import { TaskCreateForm, TaskCreateData, ProjectMemberWithUser } from '../components/tasks';
import { NavigationGuard } from '../components/common';
import { RootState, AppDispatch } from '../store';
import { fetchProjects } from '../store/slices/projectsSlice';
import { teamService } from '../services/teamService';
import { taskService } from '../services/taskService';
import { Project, Task } from '@task-manager/shared';

export const TaskCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [projectMembers, setProjectMembers] = useState<ProjectMemberWithUser[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Load project members if projectId is provided in URL
  useEffect(() => {
    if (projectId) {
      handleProjectChange(projectId);
    }
  }, [projectId]);

  const handleNavigateHome = () => {
    navigate('/dashboard');
  };

  const handleNavigateTasks = () => {
    navigate('/tasks');
  };

  const handleProjectChange = async (selectedProjectId: string) => {
    if (!selectedProjectId) {
      setProjectMembers([]);
      setAvailableTasks([]);
      return;
    }

    // Load project members and tasks separately to handle errors independently
    setMembersLoading(true);
    setTasksLoading(true);
    
    // Load project members
    try {
      const members = await teamService.getProjectMembers(selectedProjectId);
      console.log('Loaded project members:', members);
      setProjectMembers(members);
    } catch (error) {
      console.error('Failed to load project members:', error);
      setProjectMembers([]);
    } finally {
      setMembersLoading(false);
    }

    // Load project tasks
    try {
      const tasks = await taskService.getProjectTasks(selectedProjectId);
      console.log('Loaded project tasks:', tasks);
      setAvailableTasks(tasks);
    } catch (error) {
      console.error('Failed to load project tasks:', error);
      setAvailableTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleSubmit = async (data: TaskCreateData) => {
    setSubmitting(true);
    try {
      const createdTask = await taskService.createTask(data);
      console.log('Task created successfully:', createdTask);
      
      // Navigate back to tasks or project view
      if (data.projectId) {
        navigate(`/projects/${data.projectId}`);
      } else {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
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

    // Navigate back to previous page or tasks
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/tasks');
    }
  };

  const handleUnsavedChanges = (hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  };

  // Filter projects to only show those the user has access to
  const accessibleProjects = projects.filter(project => 
    // TODO: Implement proper permission checking
    // For now, show all projects
    true
  );

  // Prepare initial form data
  const initialData: Partial<TaskCreateData> = projectId ? { projectId } : {};

  const handleBreadcrumbNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmed) return;
    }
    navigate(path);
  };

  return (
    <>
      <NavigationGuard
        hasUnsavedChanges={hasUnsavedChanges}
        message="You have unsaved task details. Are you sure you want to leave this page?"
        onConfirmNavigation={() => setHasUnsavedChanges(false)}
      />
      
      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => handleBreadcrumbNavigation('/dashboard')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            <HomeIcon fontSize="small" />
            Dashboard
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={() => handleBreadcrumbNavigation('/tasks')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            <TaskIcon fontSize="small" />
            Tasks
          </Link>
          <Typography 
            color="text.primary" 
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <AddIcon fontSize="small" />
            Create Task
          </Typography>
        </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 600
          }}
        >
          <AddIcon />
          Create New Task
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Fill in the details below to create a new task for your project.
        </Typography>
      </Box>

      {/* Main Content Area */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 4,
          borderRadius: 2
        }}
      >
        {projectsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TaskCreateForm
            initialData={initialData}
            projects={accessibleProjects}
            projectMembers={projectMembers}
            availableTasks={availableTasks}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onProjectChange={handleProjectChange}
            onUnsavedChanges={handleUnsavedChanges}
            loading={submitting || membersLoading || tasksLoading}
          />
        )}
      </Paper>
      </Container>
    </>
  );
};