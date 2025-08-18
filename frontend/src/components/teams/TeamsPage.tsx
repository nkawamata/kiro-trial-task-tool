import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { TeamRole } from '@task-manager/shared';
import { RootState, AppDispatch } from '../../store';
import { fetchUserTeams, createTeam, deleteTeam } from '../../store/slices/teamsSlice';

export const TeamsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { userTeams, userTeamsLoading, userTeamsError } = useSelector((state: RootState) => state.teams);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUserTeams());
  }, [dispatch]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      await dispatch(createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined
      })).unwrap();
      
      setCreateDialogOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await dispatch(deleteTeam(teamId)).unwrap();
      setMenuAnchor(null);
      setSelectedTeamId(null);
    } catch (error) {
      // Error handled by Redux
    }
  };

  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case TeamRole.OWNER: return 'primary';
      case TeamRole.ADMIN: return 'secondary';
      case TeamRole.MEMBER: return 'default';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: TeamRole) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (userTeamsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Teams</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Team
        </Button>
      </Box>

      {userTeamsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {userTeamsError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {userTeams.map((team) => (
          <Grid item xs={12} sm={6} md={4} key={team.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {team.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setMenuAnchor(e.currentTarget);
                      setSelectedTeamId(team.id);
                    }}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>
                
                {team.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {team.description}
                  </Typography>
                )}
                
                <Chip
                  label={getRoleLabel(team.role)}
                  size="small"
                  color={getRoleColor(team.role) as any}
                  variant="outlined"
                />
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  Manage
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {userTeams.length === 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No teams yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create your first team to start collaborating with others
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Team
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Team Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setSelectedTeamId(null);
        }}
      >
        {selectedTeamId && (
          <div>
            <MenuItem onClick={() => {
              navigate(`/teams/${selectedTeamId}`);
              setMenuAnchor(null);
              setSelectedTeamId(null);
            }}>
              <EditIcon sx={{ mr: 1 }} />
              Manage Team
            </MenuItem>
            {userTeams.find(t => t.id === selectedTeamId)?.role === TeamRole.OWNER && (
              <MenuItem 
                onClick={() => handleDeleteTeam(selectedTeamId)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon sx={{ mr: 1 }} />
                Delete Team
              </MenuItem>
            )}
          </div>
        )}
      </Menu>

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="outlined"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newTeamDescription}
            onChange={(e) => setNewTeamDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateTeam}
            variant="contained"
            disabled={!newTeamName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};