import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { ProjectRole, User } from '@task-manager/shared';
import { teamService } from '../../services/teamService';

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onAddMember: (userId: string, role: ProjectRole) => Promise<void>;
  projectId: string;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onClose,
  onAddMember,
  projectId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>(ProjectRole.MEMBER);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setError('');
      const users = await teamService.searchUsers(searchQuery.trim());
      setSearchResults(users);
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;

    try {
      setAdding(true);
      setError('');
      await onAddMember(selectedUser.id, selectedRole);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setSelectedRole(ProjectRole.MEMBER);
    setError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Team Member</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Search users by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              disabled={adding}
            />
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching || adding}
            >
              {searching ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Box>

          {searchResults.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Search Results:
              </Typography>
              <List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
                {searchResults.map((user) => (
                  <ListItem key={user.id} disablePadding>
                    <ListItemButton
                      selected={selectedUser?.id === user.id}
                      onClick={() => setSelectedUser(user)}
                      disabled={adding}
                    >
                      <ListItemText
                        primary={user.name}
                        secondary={user.email}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {selectedUser && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Selected User: {selectedUser.name} ({selectedUser.email})
              </Typography>
              
              <FormControl fullWidth disabled={adding}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Role"
                  onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                >
                  <MenuItem value={ProjectRole.VIEWER}>Viewer</MenuItem>
                  <MenuItem value={ProjectRole.MEMBER}>Member</MenuItem>
                  <MenuItem value={ProjectRole.ADMIN}>Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={adding}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAddMember}
          disabled={!selectedUser || adding}
        >
          {adding ? 'Adding...' : 'Add Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};