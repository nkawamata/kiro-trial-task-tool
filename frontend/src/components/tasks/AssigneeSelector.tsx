import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';
import { User, ProjectRole } from '@task-manager/shared';

export interface ProjectMemberWithUser {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: Date;
  user: User;
}

interface AssigneeSelectorProps {
  value?: string;
  onChange: (userId?: string) => void;
  projectMembers: ProjectMemberWithUser[];
  loading?: boolean;
  disabled?: boolean;
  allowUnassigned?: boolean;
  label?: string;
  placeholder?: string;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  value,
  onChange,
  projectMembers,
  loading = false,
  disabled = false,
  allowUnassigned = true,
  label = 'Assignee',
  placeholder = 'Select an assignee'
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getRoleColor = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.OWNER:
        return 'primary';
      case ProjectRole.ADMIN:
        return 'secondary';
      case ProjectRole.MEMBER:
        return 'info';
      case ProjectRole.VIEWER:
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: ProjectRole) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Filter members based on search query
  const filteredMembers = projectMembers.filter(member =>
    member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort members: owners first, then admins, then members, then viewers
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const roleOrder = {
      [ProjectRole.OWNER]: 0,
      [ProjectRole.ADMIN]: 1,
      [ProjectRole.MEMBER]: 2,
      [ProjectRole.VIEWER]: 3
    };
    
    const roleComparison = roleOrder[a.role] - roleOrder[b.role];
    if (roleComparison !== 0) return roleComparison;
    
    // Then by name
    return a.user.name.localeCompare(b.user.name);
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <FormControl fullWidth disabled={disabled || loading}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        label={label}
        onChange={(e) => onChange(e.target.value || undefined)}
        displayEmpty
        MenuProps={{
          PaperProps: {
            sx: { maxHeight: 400 }
          }
        }}
      >
        {/* Search field in dropdown */}
        {projectMembers.length > 0 && (
          <MenuItem disabled sx={{ py: 1 }}>
            <TextField
              size="small"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => {
                e.stopPropagation();
                setSearchQuery(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </MenuItem>
        )}

        {/* Unassigned option */}
        {allowUnassigned && (
          <MenuItem value="">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
                <PersonIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  Unassigned
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  No assignee selected
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        )}

        {loading && (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading team members...</Typography>
            </Box>
          </MenuItem>
        )}

        {!loading && projectMembers.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No team members available
            </Typography>
          </MenuItem>
        )}

        {!loading && sortedMembers.length === 0 && searchQuery && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No members found matching "{searchQuery}"
            </Typography>
          </MenuItem>
        )}

        {!loading && sortedMembers.map((member) => (
          <MenuItem key={member.user.id} value={member.user.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {getInitials(member.user.name)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'medium',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {member.user.name}
                  </Typography>
                  <Chip
                    label={getRoleLabel(member.role)}
                    size="small"
                    color={getRoleColor(member.role) as any}
                    variant="outlined"
                    sx={{ ml: 1, flexShrink: 0 }}
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {member.user.email}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};