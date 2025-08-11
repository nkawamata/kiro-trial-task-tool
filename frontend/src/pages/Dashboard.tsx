import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, CardActionArea, IconButton } from '@mui/material';
import { Add as AddIcon, Dashboard as DashboardIcon, Edit as EditIcon, Assignment as TaskIcon } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProjects } from '../store/slices/projectsSlice';
import { CreateProjectDialog, UpdateProjectDialog } from '../components/projects';
import { Project } from '@task-manager/shared';

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { projects, loading } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  const handleEditProject = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click navigation
    setSelectedProject(project);
    setUpdateDialogOpen(true);
  };

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DashboardIcon />
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Projects
              </Typography>
              {loading ? (
                <Typography>Loading projects...</Typography>
              ) : projects.length === 0 ? (
                <Typography color="text.secondary">
                  No projects yet. Create your first project to get started!
                </Typography>
              ) : (
                <Box>
                  {projects.slice(0, 5).map((project) => (
                    <Card
                      key={project.id}
                      sx={{ mb: 2, cursor: 'pointer' }}
                      elevation={1}
                    >
                      <CardActionArea onClick={() => navigate(`/projects/${project.id}`)}>
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {project.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={(e) => handleEditProject(project, e)}
                                sx={{ p: 0.5 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <Chip
                                label={project.status.replace('_', ' ').toUpperCase()}
                                size="small"
                                color={getStatusColor(project.status) as any}
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {project.description || 'No description provided'}
                          </Typography>
                          {project.startDate && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Started: {new Date(project.startDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}
                  {projects.length > 5 && (
                    <Button
                      variant="text"
                      onClick={() => navigate('/projects')}
                      sx={{ mt: 1 }}
                    >
                      View All Projects ({projects.length})
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {projects.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Projects
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="secondary">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tasks Due Today
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<TaskIcon />}
                  onClick={() => navigate('/tasks/create')}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Create Task
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      <UpdateProjectDialog
        open={updateDialogOpen}
        onClose={() => {
          setUpdateDialogOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
      />
    </Box>
  );
};