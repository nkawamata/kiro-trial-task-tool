import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppDispatch } from '../../store';
import { createProject } from '../../store/slices/projectsSlice';
import { ProjectStatus } from '@task-manager/shared';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: null as Date | null,
    status: ProjectStatus.PLANNING,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await dispatch(createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: formData.status,
      })).unwrap();

      // Reset form and close dialog
      setFormData({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: null,
        status: ProjectStatus.PLANNING,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: null,
        status: ProjectStatus.PLANNING,
      });
      setError('');
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Project Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                autoFocus
                disabled={loading}
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
                disabled={loading}
              />

              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date || new Date() })}
                disabled={loading}
              />

              <DatePicker
                label="End Date (Optional)"
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                disabled={loading}
              />

              <FormControl fullWidth disabled={loading}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                >
                  <MenuItem value={ProjectStatus.PLANNING}>Planning</MenuItem>
                  <MenuItem value={ProjectStatus.ACTIVE}>Active</MenuItem>
                  <MenuItem value={ProjectStatus.ON_HOLD}>On Hold</MenuItem>
                  <MenuItem value={ProjectStatus.COMPLETED}>Completed</MenuItem>
                  <MenuItem value={ProjectStatus.CANCELLED}>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};