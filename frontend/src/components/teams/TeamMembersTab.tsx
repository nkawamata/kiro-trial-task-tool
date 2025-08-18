import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  TextField,
  Autocomplete
} from '@mui/material';
import {
  PersonAdd as AddIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { TeamRole, User } from '@task-manager/shared';
import { RootState, AppDispatch } from '../../store';
import { 
  fetchTeamMembers, 
  addTeamMember, 
  removeTeamMember, 
  updateTeamMemberRole 
} from '../../store/slices/teamsSlice';
import { searchUsers } from '../../store/slices/usersSlice';
import { TeamMemberWithUser } from '../../services/teamsService';

interface TeamMembersTabProps {
  teamId: string;
  canManageTeam: boolean;
}

export const TeamMembersTab: React.FC<TeamMembersTabProps> = ({ teamId, canManageTeam }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const { 
    teamMembers, 
    teamMembersLoading, 
    teamMembersError 
  } = useSelector((state: RootState) => state.teams);
  
  const { searchResults: userSearchResults } = useSelector((state: RootState) => state.users);
  
  const members = teamMembers[teamId] || [];
  const loading = teamMembersLoading[teamId] || false;
  const error = teamMembersError[teamId] || null;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<TeamRole>(TeamRole.MEMBER);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithUser | null>(null);

  useEffect(() => {
    dispatch(fetchTeamMembers(teamId));
  }, [dispatch, teamId]);

  useEffect(() => {
    if (userSearchQuery.length >= 2) {
      dispatch(searchUsers(userSearchQuery));
    }
  }, [dispatch, userSearchQuery]);

  const handleAddMember = async () => {
    if (!selectedUser) return;

    try {
      await dispatch(addTeamMember({
        teamId,
        userId: selectedUser.id,
        role: selectedRole
      })).unwrap();
      
      await dispatch(fetchTeamMembers(teamId));
      setAddDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole(TeamRole.MEMBER);
      setUserSearchQuery('');
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleRemoveMember = async (member: TeamMemberWithUser) => {
    try {
      await dispatch(removeTeamMember({
        teamId,
        userId: member.userId
      })).unwrap();
      
      setMenuAnchor(null);
      setSelectedMember(null);
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleUpdateRole = async (member: TeamMemberWithUser, newRole: TeamRole) => {
    try {
      await dispatch(updateTeamMemberRole({
        teamId,
        userId: member.userId,
        role: newRole
      })).unwrap();
      
      setMenuAnchor(null);
      setSelectedMember(null);
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

  const availableUsers = userSearchResults.filter(user => 
    !members.some(member => member.userId === user.id)
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
            Add Member
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
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
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
                  No team members yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setSelectedMember(null);
        }}
      >
        {selectedMember && selectedMember.role !== TeamRole.OWNER && (
          <div>
            {selectedMember.role !== TeamRole.ADMIN && (
              <MenuItem onClick={() => handleUpdateRole(selectedMember, TeamRole.ADMIN)}>
                <EditIcon sx={{ mr: 1 }} />
                Make Admin
              </MenuItem>
            )}
            {selectedMember.role !== TeamRole.MEMBER && (
              <MenuItem onClick={() => handleUpdateRole(selectedMember, TeamRole.MEMBER)}>
                <EditIcon sx={{ mr: 1 }} />
                Make Member
              </MenuItem>
            )}
            <MenuItem 
              onClick={() => handleRemoveMember(selectedMember)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              Remove from Team
            </MenuItem>
          </div>
        )}
      </Menu>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={availableUsers}
            getOptionLabel={(user) => `${user.name} (${user.email})`}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            inputValue={userSearchQuery}
            onInputChange={(_, newInputValue) => setUserSearchQuery(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users"
                margin="dense"
                fullWidth
                variant="outlined"
              />
            )}
            sx={{ mb: 2 }}
          />
          
          <Autocomplete
            options={Object.values(TeamRole).filter(role => role !== TeamRole.OWNER)}
            getOptionLabel={(role) => getRoleLabel(role)}
            value={selectedRole}
            onChange={(_, newValue) => setSelectedRole(newValue || TeamRole.MEMBER)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Role"
                margin="dense"
                fullWidth
                variant="outlined"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddMember}
            variant="contained"
            disabled={!selectedUser}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};