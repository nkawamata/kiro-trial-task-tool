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
  CircularProgress,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import { Search as SearchIcon, Link as LinkIcon, Warning as WarningIcon } from '@mui/icons-material';
import { Task, TaskStatus, TaskPriority } from '@task-manager/shared';

interface TaskDependencySelectorProps {
  value: string[];
  onChange: (taskIds: string[]) => void;
  availableTasks: Task[];
  loading?: boolean;
  disabled?: boolean;
  currentTaskId?: string; // To prevent self-dependency
  label?: string;
}

export const TaskDependencySelector: React.FC<TaskDependencySelectorProps> = ({
  value,
  onChange,
  availableTasks,
  loading = false,
  disabled = false,
  currentTaskId,
  label = 'Dependencies'
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'default';
      case TaskStatus.IN_PROGRESS:
        return 'info';
      case TaskStatus.IN_REVIEW:
        return 'warning';
      case TaskStatus.DONE:
        return 'success';
      case TaskStatus.BLOCKED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'success';
      case TaskPriority.MEDIUM:
        return 'info';
      case TaskPriority.HIGH:
        return 'warning';
      case TaskPriority.URGENT:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Filter out current task to prevent self-dependency
  const selectableTasks = availableTasks.filter(task => 
    task.id !== currentTaskId
  );

  // Filter tasks based on search query
  const filteredTasks = selectableTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort tasks: incomplete first, then by priority, then by title
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Incomplete tasks first
    const aComplete = a.status === TaskStatus.DONE;
    const bComplete = b.status === TaskStatus.DONE;
    if (aComplete !== bComplete) {
      return aComplete ? 1 : -1;
    }

    // Then by priority (urgent first)
    const priorityOrder = {
      [TaskPriority.URGENT]: 0,
      [TaskPriority.HIGH]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 3
    };
    const priorityComparison = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityComparison !== 0) return priorityComparison;

    // Then by title
    return a.title.localeCompare(b.title);
  });

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const selectedIds = typeof event.target.value === 'string' 
      ? event.target.value.split(',') 
      : event.target.value;
    
    // Check for potential circular dependencies
    const newDependencies = selectedIds.filter(id => id !== '');
    onChange(newDependencies);
  };

  const handleDelete = (taskIdToRemove: string) => {
    onChange(value.filter(id => id !== taskIdToRemove));
  };

  // Get selected task objects for display
  const selectedTasks = value.map(id => 
    availableTasks.find(task => task.id === id)
  ).filter(Boolean) as Task[];

  // Check for potential circular dependencies (simplified check)
  const hasCircularDependency = (taskId: string): boolean => {
    const task = availableTasks.find(t => t.id === taskId);
    if (!task) return false;
    
    // Check if the task we're trying to add as dependency already depends on current task
    return task.dependencies.includes(currentTaskId || '');
  };

  return (
    <Box>
      <FormControl fullWidth disabled={disabled || loading}>
        <InputLabel>{label}</InputLabel>
        <Select
          multiple
          value={value}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          renderValue={() => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedTasks.map((task) => (
                <Chip
                  key={task.id}
                  label={task.title}
                  size="small"
                  onDelete={() => handleDelete(task.id)}
                  color={getStatusColor(task.status) as any}
                  variant="outlined"
                  icon={hasCircularDependency(task.id) ? <WarningIcon /> : <LinkIcon />}
                />
              ))}
            </Box>
          )}
          MenuProps={{
            PaperProps: {
              sx: { maxHeight: 400 }
            }
          }}
        >
          {/* Search field in dropdown */}
          {selectableTasks.length > 0 && (
            <MenuItem disabled sx={{ py: 1 }}>
              <TextField
                size="small"
                placeholder="Search tasks..."
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

          {loading && (
            <MenuItem disabled>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Loading tasks...</Typography>
              </Box>
            </MenuItem>
          )}

          {!loading && selectableTasks.length === 0 && (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No tasks available for dependencies
              </Typography>
            </MenuItem>
          )}

          {!loading && sortedTasks.length === 0 && searchQuery && (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No tasks found matching "{searchQuery}"
              </Typography>
            </MenuItem>
          )}

          {!loading && sortedTasks.map((task) => {
            const isSelected = value.includes(task.id);
            const hasCircular = hasCircularDependency(task.id);
            
            return (
              <MenuItem 
                key={task.id} 
                value={task.id}
                disabled={hasCircular}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isSelected ? 'bold' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}
                    >
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      <Chip
                        label={getPriorityLabel(task.priority)}
                        size="small"
                        color={getPriorityColor(task.priority) as any}
                        variant="outlined"
                      />
                      <Chip
                        label={getStatusLabel(task.status)}
                        size="small"
                        color={getStatusColor(task.status) as any}
                        variant="filled"
                      />
                    </Box>
                  </Box>
                  
                  {task.description && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5
                      }}
                    >
                      {task.description}
                    </Typography>
                  )}

                  {hasCircular && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <WarningIcon fontSize="small" color="warning" />
                      <Typography variant="caption" color="warning.main">
                        Would create circular dependency
                      </Typography>
                    </Box>
                  )}

                  {task.startDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Start: {new Date(task.startDate).toLocaleDateString()}
                      {task.endDate && (
                        <> • End: {new Date(task.endDate).toLocaleDateString()}</>
                      )}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {/* Selected dependencies summary */}
      {selectedTasks.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Selected Dependencies ({selectedTasks.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            {selectedTasks.map((task) => (
              <Box 
                key={task.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: hasCircularDependency(task.id) ? 'warning.light' : 'background.paper'
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {task.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip
                      label={getStatusLabel(task.status)}
                      size="small"
                      color={getStatusColor(task.status) as any}
                      variant="outlined"
                    />
                    <Chip
                      label={getPriorityLabel(task.priority)}
                      size="small"
                      color={getPriorityColor(task.priority) as any}
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Box sx={{ ml: 1 }}>
                  {hasCircularDependency(task.id) && (
                    <WarningIcon color="warning" fontSize="small" />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};