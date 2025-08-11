import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Grid,
  Alert,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TaskStatus, TaskPriority, Project, Task } from '@task-manager/shared';
import { ProjectSelector } from './ProjectSelector';
import { AssigneeSelector, ProjectMemberWithUser } from './AssigneeSelector';
import { TaskDependencySelector } from './TaskDependencySelector';

export interface TaskCreateData {
  title: string;
  description: string;
  projectId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: Date;
  endDate?: Date;
  estimatedHours?: number;
  dependencies: string[];
}

interface TaskCreateFormProps {
  initialData?: Partial<TaskCreateData>;
  projects: Project[];
  projectMembers: ProjectMemberWithUser[];
  availableTasks: Task[];
  onSubmit: (data: TaskCreateData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  onProjectChange?: (projectId: string) => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
  isEditMode?: boolean;
}

export const TaskCreateForm: React.FC<TaskCreateFormProps> = ({
  initialData,
  projects,
  projectMembers,
  availableTasks,
  onSubmit,
  onCancel,
  loading = false,
  onProjectChange,
  onUnsavedChanges,
  isEditMode = false
}) => {
  const [formData, setFormData] = useState<TaskCreateData>({
    title: '',
    description: '',
    projectId: '',
    assigneeId: undefined,
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    startDate: undefined,
    endDate: undefined,
    estimatedHours: undefined,
    dependencies: [],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Project validation
    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    // Description validation
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      if (formData.endDate <= formData.startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // Estimated hours validation
    if (formData.estimatedHours !== undefined) {
      if (formData.estimatedHours < 0.1) {
        newErrors.estimatedHours = 'Estimated hours must be at least 0.1';
      } else if (formData.estimatedHours > 999) {
        newErrors.estimatedHours = 'Estimated hours must be less than 999';
      }
    }

    // Project timeline validation
    if (formData.projectId && (formData.startDate || formData.endDate)) {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      if (selectedProject) {
        if (formData.startDate && formData.startDate < selectedProject.startDate) {
          newErrors.startDate = 'Start date cannot be before project start date';
        }
        if (selectedProject.endDate && formData.endDate && formData.endDate > selectedProject.endDate) {
          newErrors.endDate = 'End date cannot be after project end date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitError('');
      await onSubmit(formData);
      
      // Clear unsaved changes flag on successful submit
      setHasUnsavedChanges(false);
      onUnsavedChanges?.(false);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to create task');
    }
  };

  const handleFieldChange = (field: keyof TaskCreateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark as having unsaved changes
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
      onUnsavedChanges?.(true);
    }
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Handle project change
    if (field === 'projectId' && onProjectChange) {
      onProjectChange(value);
      // Clear assignee when project changes
      setFormData(prev => ({ ...prev, assigneeId: undefined }));
    }
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Basic Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Basic Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Task Title"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              required
              fullWidth
              disabled={loading}
              placeholder="Enter a descriptive title for the task"
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              multiline
              rows={4}
              fullWidth
              disabled={loading}
              placeholder="Provide additional details about the task (optional)"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <ProjectSelector
              value={formData.projectId}
              onChange={(projectId) => handleFieldChange('projectId', projectId)}
              projects={projects}
              loading={loading}
              error={errors.projectId}
              disabled={loading}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <AssigneeSelector
              value={formData.assigneeId}
              onChange={(userId) => handleFieldChange('assigneeId', userId)}
              projectMembers={projectMembers}
              loading={loading}
              disabled={loading || !formData.projectId}
              allowUnassigned
            />
          </Grid>

          {/* Status and Priority Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: { xs: 1, md: 2 }, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Status and Priority
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => handleFieldChange('status', e.target.value as TaskStatus)}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }
                }}
              >
                <MenuItem value={TaskStatus.TODO}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="To Do" size="small" color="default" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>To Do</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="In Progress" size="small" color="info" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>In Progress</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value={TaskStatus.IN_REVIEW}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="In Review" size="small" color="warning" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>In Review</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value={TaskStatus.DONE}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="Done" size="small" color="success" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>Done</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value={TaskStatus.BLOCKED}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="Blocked" size="small" color="error" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>Blocked</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => handleFieldChange('priority', e.target.value as TaskPriority)}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }
                }}
              >
                <MenuItem value={TaskPriority.LOW}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="Low" size="small" color="success" variant="outlined" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>Low</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value={TaskPriority.MEDIUM}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="Medium" size="small" color="info" variant="outlined" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>Medium</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value={TaskPriority.HIGH}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="High" size="small" color="warning" variant="outlined" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>High</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value={TaskPriority.URGENT}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip label="Urgent" size="small" color="error" variant="outlined" />
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>Urgent</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Scheduling Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: { xs: 1, md: 2 }, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Scheduling
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Start Date"
              value={formData.startDate || null}
              onChange={(date) => handleFieldChange('startDate', date)}
              disabled={loading}
              slotProps={{
                textField: {
                  error: !!errors.startDate,
                  helperText: errors.startDate,
                  fullWidth: true,
                  size: 'medium',
                  sx: {
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '0.9rem', md: '1rem' }
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="End Date"
              value={formData.endDate || null}
              onChange={(date) => handleFieldChange('endDate', date)}
              disabled={loading}
              minDate={formData.startDate || undefined}
              slotProps={{
                textField: {
                  error: !!errors.endDate,
                  helperText: errors.endDate,
                  fullWidth: true,
                  size: 'medium',
                  sx: {
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '0.9rem', md: '1rem' }
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            <TextField
              label="Estimated Hours"
              type="number"
              value={formData.estimatedHours || ''}
              onChange={(e) => handleFieldChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)}
              error={!!errors.estimatedHours}
              helperText={errors.estimatedHours}
              fullWidth
              disabled={loading}
              inputProps={{ min: 0.1, max: 999, step: 0.5 }}
              placeholder="e.g., 8.5"
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }
              }}
            />
          </Grid>

          {/* Dependencies Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Dependencies
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TaskDependencySelector
              value={formData.dependencies}
              onChange={(dependencies) => handleFieldChange('dependencies', dependencies)}
              availableTasks={availableTasks.filter(task => task.projectId === formData.projectId)}
              loading={loading}
              disabled={loading || !formData.projectId}
              label="Task Dependencies (Optional)"
            />
          </Grid>

          {/* Project Info Display */}
          {selectedProject && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Project Timeline:</strong> {' '}
                  {new Date(selectedProject.startDate).toLocaleDateString()}
                  {selectedProject.endDate && (
                    <> to {new Date(selectedProject.endDate).toLocaleDateString()}</>
                  )}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Form Actions */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !formData.title.trim() || !formData.projectId}
                size="large"
              >
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Task' : 'Create Task')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};