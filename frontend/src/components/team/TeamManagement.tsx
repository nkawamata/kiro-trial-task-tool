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
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as AddIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { ProjectRole } from '@task-manager/shared';
import { RootState, AppDispatch } from '../../store';
import { fetchProjectMembers, addProjectMember, removeProjectMember, updateMemberRole } from '../../store/slices/teamSlice';
import { ProjectMemberWithUser } from '../../services/teamService';
import { AddMemberDialog } from './AddMemberDialog';

interface TeamManagementProps {
  projectId: string;
  canManageTeam: boolean;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ projectId, canManageTeam }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { members: allMembers, loading, error } = useSelector((state: RootState) => state.team);
  const members = allMembers[projectId] || [];
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<ProjectMemberWithUser | null>(null);

  useEffect(() => {
    dispatch(fetchProjectMembers(projectId));
  }, [dispatch, projectId]);

  const handleAddMember = async (userId: string, role: ProjectRole) => {
    try {
      await dispatch(addProjectMember({ projectId, userId, role })).unwrap();
      await dispatch(fetchProjectMembers(projectId));
      setAddDialogOpen(false);
    } catch (err: any) {
      // Error is handled by Redux
    }
  };

  const handleRemoveMember = async (member: ProjectMemberWithUser) => {
    try {
      await dispatch(removeProjectMember({ projectId, userId: member.userId })).unwrap();
      setMenuAnchor(null);
      setSelectedMember(null);
    } catch (err: any) {
      // Error is handled by Redux
    }
  };

  const handleUpdateRole = async (member: ProjectMemberWithUser, newRole: ProjectRole) => {
    try {
      await dispatch(updateMemberRole({ projectId, userId: member.userId, role: newRole })).unwrap();
      setMenuAnchor(null);
      setSelectedMember(null);
    } catch (err: any) {
      // Error is handled by Redux
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Team Members</Typography>
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
                    <Typography color="text.secondary">
                      No team members yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => {
            setMenuAnchor(null);
            setSelectedMember(null);
          }}
        >
          {selectedMember && selectedMember.role !== ProjectRole.OWNER && (
            <div>
              <MenuItem onClick={() => handleUpdateRole(selectedMember, ProjectRole.ADMIN)}>
                <EditIcon sx={{ mr: 1 }} />
                Make Admin
              </MenuItem>
              <MenuItem onClick={() => handleUpdateRole(selectedMember, ProjectRole.MEMBER)}>
                <EditIcon sx={{ mr: 1 }} />
                Make Member
              </MenuItem>
              <MenuItem onClick={() => handleUpdateRole(selectedMember, ProjectRole.VIEWER)}>
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

        <AddMemberDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAddMember={handleAddMember}
          projectId={projectId}
        />
      </CardContent>
    </Card>
  );
};