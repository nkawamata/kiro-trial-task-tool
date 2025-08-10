import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Chip,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { User, ProjectRole } from '@task-manager/shared';
import { teamService } from '../../services/teamService';

interface TeamMember {
  user: User;
  role: ProjectRole;
}

interface TeamMemberSelectorProps {
  members: TeamMember[];
  onChange: (members: TeamMember[]) => void;
  disabled?: boolean;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  members,
  onChange,
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>(ProjectRole.MEMBER);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const users = await teamService.searchUsers(searchQuery.trim());
      // Filter out users already added
      const existingUserIds = members.map(m => m.user.id);
      const filteredUsers = users.filter(user => !existingUserIds.includes(user.id));
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = (user: User) => {
    const newMember: TeamMember = { user, role: selectedRole };
    onChange([...members, newMember]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    onChange(members.filter(m => m.user.id !== userId));
  };

  const handleRoleChange = (userId: string, newRole: ProjectRole) => {
    onChange(members.map(m => 
      m.user.id === userId ? { ...m, role: newRole } : m
    ));
  };

  const getRoleColor = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.ADMIN: return 'secondary';
      case ProjectRole.MEMBER: return 'default';
      case ProjectRole.VIEWER: return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Team Members
      </Typography>
      
      {/* Search and Add */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search users by name or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={disabled}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedRole}
            label="Role"
            onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
            disabled={disabled}
          >
            <MenuItem value={ProjectRole.VIEWER}>Viewer</MenuItem>
            <MenuItem value={ProjectRole.MEMBER}>Member</MenuItem>
            <MenuItem value={ProjectRole.ADMIN}>Admin</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={handleSearch}
          disabled={!searchQuery.trim() || searching || disabled}
          startIcon={searching ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Search
        </Button>
      </Box>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Search Results:
          </Typography>
          <List dense sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
            {searchResults.map((user) => (
              <ListItem key={user.id} disablePadding>
                <ListItemButton onClick={() => handleAddMember(user)} disabled={disabled}>
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

      {/* Selected Members */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {members.map((member) => (
          <Chip
            key={member.user.id}
            label={`${member.user.name} (${member.role})`}
            color={getRoleColor(member.role) as any}
            variant="outlined"
            onDelete={disabled ? undefined : () => handleRemoveMember(member.user.id)}
            deleteIcon={<CloseIcon />}
          />
        ))}
        {members.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No team members added yet
          </Typography>
        )}
      </Box>
    </Box>
  );
};