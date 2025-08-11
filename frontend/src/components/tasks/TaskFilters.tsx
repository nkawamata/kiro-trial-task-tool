import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { TaskStatus, TaskPriority, Project } from '@task-manager/shared';

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  projectId: string | 'all';
  assignedToMe: boolean;
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  projects: Project[];
  loading?: boolean;
}

export const TaskFiltersComponent: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  projects,
  loading = false
}) => {
  const handleFilterChange = (field: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value as TaskStatus | 'all')}
                disabled={loading}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value={TaskStatus.TODO}>To Do</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.IN_REVIEW}>In Review</MenuItem>
                <MenuItem value={TaskStatus.DONE}>Done</MenuItem>
                <MenuItem value={TaskStatus.BLOCKED}>Blocked</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange('priority', e.target.value as TaskPriority | 'all')}
                disabled={loading}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value={TaskPriority.URGENT}>Urgent</MenuItem>
                <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select
                value={filters.projectId}
                label="Project"
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                disabled={loading}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant={filters.assignedToMe ? 'contained' : 'outlined'}
              size="small"
              fullWidth
              onClick={() => handleFilterChange('assignedToMe', !filters.assignedToMe)}
              startIcon={<PersonIcon />}
              disabled={loading}
            >
              My Tasks
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};