import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Tabs, Tab, Card, CardContent, Button, Chip, Link } from '@mui/material';
import { Folder as ProjectIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProjectTasks } from '../store/slices/tasksSlice';
import { fetchProject } from '../store/slices/projectsSlice';
import { UpdateProjectDialog } from '../components/projects';
import { TeamManagement } from '../components/team';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  
  const [tabValue, setTabValue] = React.useState(0);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  
  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (projectId) {
      // If project is not in store, fetch it
      if (!project) {
        dispatch(fetchProject(projectId));
      }
      dispatch(fetchProjectTasks(projectId));
    }
  }, [dispatch, projectId, project]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTask = () => {
    navigate(`/tasks/create?projectId=${projectId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'planning': return 'info';
      case 'on_hold': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (projectsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Loading project...</Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Project not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ProjectIcon />
            <Typography variant="h4" component="h1">
              {project.name}
            </Typography>
            <Chip
              label={project.status.replace('_', ' ').toUpperCase()}
              size="small"
              color={getStatusColor(project.status) as any}
              variant="outlined"
              sx={{ ml: 2 }}
            />
          </Box>
          {project.description && (
            <Typography variant="body1" color="text.secondary">
              {project.description}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setUpdateDialogOpen(true)}
        >
          Edit Project
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Tasks" />
          <Tab label="Timeline" />
          <Tab label="Team" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Project Tasks
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateTask}
                size="small"
              >
                Create Task
              </Button>
            </Box>
            {tasksLoading ? (
              <Typography>Loading tasks...</Typography>
            ) : tasks.length === 0 ? (
              <Typography color="text.secondary">
                No tasks in this project yet.
              </Typography>
            ) : (
              <Box>
                {tasks.map((task) => (
                  <Box key={task.id} sx={{ py: 2, borderBottom: '1px solid #eee' }}>
                    <Link
                      component="button"
                      variant="subtitle1"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      sx={{ textAlign: 'left', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {task.title}
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                      Status: {task.status} | Priority: {task.priority}
                    </Typography>
                    {task.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {task.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Timeline View</Typography>
              <Button
                variant="contained"
                onClick={() => navigate(`/gantt/${projectId}`)}
              >
                Open Gantt Chart
              </Button>
            </Box>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              View this project's tasks in an interactive Gantt chart with timeline visualization, 
              dependencies, and progress tracking.
            </Typography>
            <Box sx={{ 
              height: '300px', 
              border: '2px dashed #e0e0e0', 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="h6" color="text.secondary">
                Gantt Chart Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Click "Open Gantt Chart" to view the full interactive timeline
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TeamManagement 
          projectId={projectId!} 
          canManageTeam={true} // TODO: Implement proper permission check
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Project Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Name: {project.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {project.status.replace('_', ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start Date: {new Date(project.startDate).toLocaleDateString()}
                </Typography>
                {project.endDate && (
                  <Typography variant="body2" color="text.secondary">
                    End Date: {new Date(project.endDate).toLocaleDateString()}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setUpdateDialogOpen(true)}
                >
                  Edit Project Details
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <UpdateProjectDialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        project={project}
      />
    </Box>
  );
};