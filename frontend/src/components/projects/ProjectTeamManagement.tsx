import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField
} from '@mui/material';
import {
  PersonAdd as AddIcon,
  GroupAdd as AddTeamIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { ProjectRole, Team } from '@task-manager/shared';
import { RootState, AppDispatch } from '../../store';
import { fetchProjectMembers, addProjectMember, removeProjectMember, updateMemberRole } from '../../store/slices/teamSlice';
import { fetchProjectTeams, addTeamToProject, removeTeamFromProject, searchTeams } from '../../store/slices/teamsSlice';
import { ProjectMemberWithUser } from '../../services/teamService';
import { ProjectTeamWithTeam } from '../../services/teamsService';
import { AddMemberDialog } from '../team/AddMemberDialog';

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
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface ProjectTeamManagementProps {
  projectId: string;
  canManageTeam: boolean;
}

export const ProjectTeamManagement: React.FC<ProjectTeamManagementProps> = ({ projectId, canManageTeam }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Individual members state
  const { members: allMembers, loading: membersLoading, error: membersError } = useSelector((state: RootState) => state.team);
  const members = allMembers[projectId] || [];
  
  // Teams state
  const { 
    projectTeams, 
    projectTeamsLoading, 
    projectTeamsError,
    searchResults: teamSearchResults,
    searchLoading: teamSearchLoading
  } = useSelector((state: RootState) => state.teams);
  
  const teams = projectTeams[projectId] || [];
  const loading = projectTeamsLoading[projectId] || false;
  const error = projectTeamsError[projectId] || null;

  const [tabValue, setTabValue] = useState(0);
  
  // Individual members dialog state
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<ProjectMemberWithUser | null>(null);
  
  // Teams dialog state
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamMenuAnchor, setTeamMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProjectTeam, setSelectedProjectTeam] = useState<ProjectTeamWithTeam | null>(null);

  useEffect(() => {
    dispatch(fetchProjectMembers(projectId));
    dispatch(fetchProjectTeams(projectId));
  }, [dispatch, projectId]);

  useEffect(() => {
    if (teamSearchQuery.length >= 2) {
      dispatch(searchTeams(teamSearchQuery));
    }
  }, [dispatch, teamSearchQuery]);

  // Individual member handlers
  const handleAddMember = async (userId: string, role: ProjectRole) => {
    try {
      await dispatch(addProjectMember({ projectId, userId, role })).unwrap();
      await dispatch(fetchProjectMembers(projectId));
      setAddMemberDialogOpen(false);
    } catch (err: any) {
      // Error is handled by Redux
    }
  };

  const handleRemoveMember = async (member: ProjectMemberWithUser) => {
    try {
      await dispatch(removeProjectMember({ projectId, userId: member.userId })).unwrap();
      setMemberMenuAnchor(null);
      setSelectedMember(null);
    } catch (err: any) {
      // Error is handled by Redux
    }
  };

  const handleUpdateMemberRole = async (member: ProjectMemberWithUser, newRole: ProjectRole) => {
    try {
      await dispatch(updateMemberRole({ projectId, userId: member.userId, role: newRole })).unwrap();
      setMemberMenuAnchor(null);
      setSelectedMember(null);
    } catch (err: any) {
      // Error is handled by Redux
    }
  };

  // Team handlers
  const handleAddTeam = async () => {
    if (!selectedTeam) return;

    try {
      await dispatch(addTeamToProject({
        teamId: selectedTeam.id,
        projectId
      })).unwrap();
      
      await dispatch(fetchProjectTeams(projectId));
      setAddTeamDialogOpen(false);
      setSelectedTeam(null);
      setTeamSearchQuery('');
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleRemoveTeam = async (projectTeam: ProjectTeamWithTeam) => {
    try {
      await dispatch(removeTeamFromProject({
        teamId: projectTeam.teamId,
        projectId
      })).unwrap();
      
      setTeamMenuAnchor(null);
      setSelectedProjectTeam(null);
    } catch (error) {
      // Error handled by Redux
    }
  };

  const getRoleColor = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.OWNER: return 'primary';
      case ProjectRole.ADMIN: return 'secondary';
      case ProjectRole.MEMBER: return 'default';
      case ProjectRole.VIEWER: return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: ProjectRole) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Filter teams that aren't already added to the project
  const availableTeams = teamSearchResults.filter(team => 
    !teams.some(pt => pt.teamId === team.id)
  );

  if (membersLoading && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Project Access Management
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab 
              icon={<PersonIcon />} 
              label="Individual Members" 
              iconPosition="start"
            />
            <Tab 
              icon={<PeopleIcon />} 
              label="Teams" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Individual Project Members</Typography>
            {canManageTeam && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddMemberDialogOpen(true)}
                size="small"
              >
                Add Member
              </Button>
            )}
          </Box>

          {membersError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {membersError}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Joined</TableCell>
                  {canManageTeam && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.user.name}</TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(member.role)}
                        size="small"
                        color={getRoleColor(member.role) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {canManageTeam && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMemberMenuAnchor(e.currentTarget);
                            setSelectedMember(member);
                          }}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManageTeam ? 5 : 4} align="center">
                      <Typography color="text.secondary">
                        No individual members yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Associated Teams</Typography>
            {canManageTeam && (
              <Button
                variant="contained"
                startIcon={<AddTeamIcon />}
                onClick={() => setAddTeamDialogOpen(true)}
                size="small"
              >
                Add Team
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Added Date</TableCell>
                  {canManageTeam && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map((projectTeam) => (
                  <TableRow key={projectTeam.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        {projectTeam.team.name}
                      </Box>
                    </TableCell>
                    <TableCell>{projectTeam.team.description || '-'}</TableCell>
                    <TableCell>
                      {new Date(projectTeam.addedAt).toLocaleDateString()}
                    </TableCell>
                    {canManageTeam && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setTeamMenuAnchor(e.currentTarget);
                            setSelectedProjectTeam(projectTeam);
                          }}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {teams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManageTeam ? 4 : 3} align="center">
                      <Typography color="text.secondary">
                        No teams associated with this project yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {teams.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Team members automatically have access to this project. Manage individual team members in the Teams section.
            </Alert>
          )}
        </TabPanel>

        {/* Individual Member Actions Menu */}
        <Menu
          anchorEl={memberMenuAnchor}
          open={Boolean(memberMenuAnchor)}
          onClose={() => {
            setMemberMenuAnchor(null);
            setSelectedMember(null);
          }}
        >
          {selectedMember && selectedMember.role !== ProjectRole.OWNER && (
            <div>
              <MenuItem onClick={() => handleUpdateMemberRole(selectedMember, ProjectRole.ADMIN)}>
                <EditIcon sx={{ mr: 1 }} />
                Make Admin
              </MenuItem>
              <MenuItem onClick={() => handleUpdateMemberRole(selectedMember, ProjectRole.MEMBER)}>
                <EditIcon sx={{ mr: 1 }} />
                Make Member
              </MenuItem>
              <MenuItem onClick={() => handleUpdateMemberRole(selectedMember, ProjectRole.VIEWER)}>
                <EditIcon sx={{ mr: 1 }} />
                Make Viewer
              </MenuItem>
              <MenuItem 
                onClick={() => handleRemoveMember(selectedMember)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon sx={{ mr: 1 }} />
                Remove from Project
              </MenuItem>
            </div>
          )}
        </Menu>

        {/* Team Actions Menu */}
        <Menu
          anchorEl={teamMenuAnchor}
          open={Boolean(teamMenuAnchor)}
          onClose={() => {
            setTeamMenuAnchor(null);
            setSelectedProjectTeam(null);
          }}
        >
          {selectedProjectTeam && (
            <MenuItem 
              onClick={() => handleRemoveTeam(selectedProjectTeam)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              Remove Team from Project
            </MenuItem>
          )}
        </Menu>

        {/* Add Member Dialog */}
        <AddMemberDialog
          open={addMemberDialogOpen}
          onClose={() => setAddMemberDialogOpen(false)}
          onAddMember={handleAddMember}
          projectId={projectId}
        />

        {/* Add Team Dialog */}
        <Dialog open={addTeamDialogOpen} onClose={() => setAddTeamDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Team to Project</DialogTitle>
          <DialogContent>
            <Autocomplete
              options={availableTeams}
              getOptionLabel={(team) => team.name}
              value={selectedTeam}
              onChange={(_, newValue) => setSelectedTeam(newValue)}
              inputValue={teamSearchQuery}
              onInputChange={(_, newInputValue) => setTeamSearchQuery(newInputValue)}
              loading={teamSearchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search teams"
                  margin="dense"
                  fullWidth
                  variant="outlined"
                  helperText="Search for teams to add to this project"
                />
              )}
              renderOption={(props, team) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{team.name}</Typography>
                    {team.description && (
                      <Typography variant="body2" color="text.secondary">
                        {team.description}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddTeamDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddTeam}
              variant="contained"
              disabled={!selectedTeam}
            >
              Add Team
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};