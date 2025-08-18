import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { TeamRole } from '@task-manager/shared';
import { RootState, AppDispatch } from '../../store';
import { fetchTeam, updateTeam, deleteTeam, clearCurrentTeam } from '../../store/slices/teamsSlice';
import { TeamMembersTab } from './TeamMembersTab';
import { TeamProjectsTab } from './TeamProjectsTab';

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
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { 
    currentTeam, 
    currentTeamRole, 
    currentTeamLoading, 
    currentTeamError 
  } = useSelector((state: RootState) => state.teams);

  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (teamId) {
      dispatch(fetchTeam(teamId));
    }
    
    return () => {
      dispatch(clearCurrentTeam());
    };
  }, [dispatch, teamId]);

  useEffect(() => {
    if (currentTeam) {
      setEditName(currentTeam.name);
      setEditDescription(currentTeam.description || '');
    }
  }, [currentTeam]);

  const canManageTeam = currentTeamRole === TeamRole.OWNER || currentTeamRole === TeamRole.ADMIN;
  const canDeleteTeam = currentTeamRole === TeamRole.OWNER;

  const handleSaveEdit = async () => {
    if (!teamId || !editName.trim()) return;

    try {
      await dispatch(updateTeam({
        teamId,
        name: editName.trim(),
        description: editDescription.trim() || undefined
      })).unwrap();
      setEditMode(false);
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleCancelEdit = () => {
    if (currentTeam) {
      setEditName(currentTeam.name);
      setEditDescription(currentTeam.description || '');
    }
    setEditMode(false);
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;

    try {
      await dispatch(deleteTeam(teamId)).unwrap();
      navigate('/teams');
    } catch (error) {
      // Error handled by Redux
    }
  };

  if (currentTeamLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (currentTeamError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{currentTeamError}</Alert>
      </Box>
    );
  }

  if (!currentTeam) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Team not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/teams')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Team Details
        </Typography>
        {canDeleteTeam && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Team
          </Button>
        )}
      </Box>

      {/* Team Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            {editMode ? (
              <Box sx={{ flexGrow: 1, mr: 2 }}>
                <TextField
                  fullWidth
                  label="Team Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {currentTeam.name}
                </Typography>
                {currentTeam.description && (
                  <Typography variant="body1" color="text.secondary">
                    {currentTeam.description}
                  </Typography>
                )}
              </Box>
            )}
            
            {canManageTeam && (
              <Box>
                {editMode ? (
                  <Box>
                    <IconButton onClick={handleSaveEdit} color="primary">
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={handleCancelEdit}>
                      <CancelIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <IconButton onClick={() => setEditMode(true)}>
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            Your role: {currentTeamRole?.charAt(0).toUpperCase()}{currentTeamRole?.slice(1)}
          </Typography>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Members" />
            <Tab label="Projects" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <TeamMembersTab teamId={teamId!} canManageTeam={canManageTeam} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <TeamProjectsTab teamId={teamId!} canManageTeam={canManageTeam} />
        </TabPanel>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Team</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{currentTeam.name}"? This action cannot be undone.
            All team members will be removed and the team will be removed from all projects.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTeam} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};