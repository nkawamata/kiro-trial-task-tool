import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Project, ProjectStatus } from '@task-manager/shared';

interface ProjectSelectorProps {
  value: string;
  onChange: (projectId: string) => void;
  projects: Project[];
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  value,
  onChange,
  projects,
  loading = false,
  error,
  disabled = false,
  required = false,
  label = 'Project'
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'success';
      case ProjectStatus.PLANNING:
        return 'info';
      case ProjectStatus.ON_HOLD:
        return 'warning';
      case ProjectStatus.COMPLETED:
        return 'primary';
      case ProjectStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    return status.replace('_', ' ').toUpperCase();
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort projects: active first, then by name
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    // Active projects first
    if (a.status === ProjectStatus.ACTIVE && b.status !== ProjectStatus.ACTIVE) return -1;
    if (b.status === ProjectStatus.ACTIVE && a.status !== ProjectStatus.ACTIVE) return 1;
    
    // Then by name
    return a.name.localeCompare(b.name);
  });

  return (
    <FormControl 
      fullWidth 
      error={!!error} 
      disabled={disabled || loading}
      required={required}
    >
      <InputLabel>{label}{required ? ' *' : ''}</InputLabel>
      <Select
        value={value}
        label={`${label}${required ? ' *' : ''}`}
        onChange={(e) => onChange(e.target.value)}
        MenuProps={{
          PaperProps: {
            sx: { maxHeight: 400 }
          }
        }}
      >
        {/* Search field in dropdown */}
        <MenuItem disabled sx={{ py: 1 }}>
          <TextField
            size="small"
            placeholder="Search projects..."
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

        {loading && (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading projects...</Typography>
            </Box>
          </MenuItem>
        )}

        {!loading && sortedProjects.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No projects found' : 'No projects available'}
            </Typography>
          </MenuItem>
        )}

        {!loading && sortedProjects.map((project) => (
          <MenuItem key={project.id} value={project.id}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {project.name}
                </Typography>
                <Chip
                  label={getStatusLabel(project.status)}
                  size="small"
                  color={getStatusColor(project.status) as any}
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </Box>
              {project.description && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {project.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Started: {new Date(project.startDate).toLocaleDateString()}
                {project.endDate && (
                  <> • Ends: {new Date(project.endDate).toLocaleDateString()}</>
                )}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
      
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
          {error}
        </Typography>
      )}
    </FormControl>
  );
};