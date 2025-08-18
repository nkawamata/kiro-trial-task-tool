import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { Project } from '@task-manager/shared';
import { RootState, AppDispatch } from '../../store';
import { 
  fetchProjectTeams, 
  addTeamToProject, 
  removeTeamFromProject 
} from '../../store/slices/teamsSlice';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { ProjectTeamWithTeam } from '../../services/teamsService';

interface TeamProjectsTabProps {
  teamId: string;
  canManageTeam: boolean;
}

export const TeamProjectsTab: React.FC<TeamProjectsTabProps> = ({ teamId, canManageTeam }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { 
    projectTeams, 
    projectTeamsLoading, 
    projectTeamsError 
  } = useSelector((state: RootState) => state.teams);
  
  const { projects } = useSelector((state: RootState) => state.projects);

  // Get projects associated with this team
  const teamProjects = Object.values(projectTeams).flat().filter(pt => pt.teamId === teamId);
  const loading = Object.values(projectTeamsLoading).some(Boolean);
  const error = Object.values(projectTeamsError).find(Boolean) || null;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProjectTeam, setSelectedProjectTeam] = useState<ProjectTeamWithTeam | null>(null);

  useEffect(() => {
    // Fetch all projects to show available options
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    // Fetch project teams for each project when projects change
    projects.forEach(project => {
      dispatch(fetchProjectTeams(project.id));
    });
  }, [dispatch, projects]);

  const handleAddToProject = async () => {
    if (!selectedProject) return;

    try {
      await dispatch(addTeamToProject({
        teamId,
        projectId: selectedProject.id
      })).unwrap();
      
      await dispatch(fetchProjectTeams(selectedProject.id));
      setAddDialogOpen(false);
      setSelectedProject(null);
      setProjectSearchQuery('');
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleRemoveFromProject = async (projectTeam: ProjectTeamWithTeam) => {
    try {
      await dispatch(removeTeamFromProject({
        teamId,
        projectId: projectTeam.projectId
      })).unwrap();
      
      setMenuAnchor(null);
      setSelectedProjectTeam(null);
    } catch (error) {
      // Error handled by Redux
    }
  };

  // Filter projects that don't already have this team
  const availableProjects = projects.filter(project => 
    !teamProjects.some(tp => tp.projectId === project.id) &&
    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box />
        {canManageTeam && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add to Project
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Added Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamProjects.map((projectTeam) => {
              const project = projects.find(p => p.id === projectTeam.projectId);
              return (
                <TableRow key={projectTeam.id}>
                  <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                  <TableCell>{project?.description || '-'}</TableCell>
                  <TableCell>
                    {new Date(projectTeam.addedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => navigate(`/projects/${projectTeam.projectId}`)}
                      title="View Project"
                    >
                      <LaunchIcon />
                    </IconButton>
                    {canManageTeam && (
                      <IconButton
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setSelectedProjectTeam(projectTeam);
                        }}
                      >
                        <MoreIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {teamProjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  This team is not associated with any projects yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Project Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setSelectedProjectTeam(null);
        }}
      >
        {selectedProjectTeam && (
          <MenuItem 
            onClick={() => handleRemoveFromProject(selectedProjectTeam)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Remove from Project
          </MenuItem>
        )}
      </Menu>

      {/* Add to Project Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Team to Project</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={availableProjects}
            getOptionLabel={(project) => project.name}
            value={selectedProject}
            onChange={(_, newValue) => setSelectedProject(newValue)}
            inputValue={projectSearchQuery}
            onInputChange={(_, newInputValue) => setProjectSearchQuery(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search projects"
                margin="dense"
                fullWidth
                variant="outlined"
                helperText="Select a project to add this team to"
              />
            )}
            renderOption={(props, project) => (
              <li {...props}>
                <Box>
                  <div>{project.name}</div>
                  {project.description && (
                    <div style={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      {project.description}
                    </div>
                  )}
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddToProject}
            variant="contained"
            disabled={!selectedProject}
          >
            Add to Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};