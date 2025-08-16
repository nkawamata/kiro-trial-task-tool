import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Typography,
  Alert,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { RootState, AppDispatch } from '../../store';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { fetchProjectTasks } from '../../store/slices/tasksSlice';
import { apiClient } from '../../services/apiClient';

interface WorkloadAllocationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: Date | null;
  editingEntry?: any; // WorkloadEntry for editing
}

export const WorkloadAllocationDialog: React.FC<WorkloadAllocationDialogProps> = ({
  open,
  onClose,
  onSuccess,
  selectedDate,
  editingEntry,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects } = useSelector((state: RootState) => state.projects);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    allocatedHours: 8,
    date: selectedDate || new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchProjects());
      // Set the date when dialog opens with selected date or editing entry
      if (editingEntry) {
        const entryDate = typeof editingEntry.date === 'string' 
          ? new Date(editingEntry.date) 
          : editingEntry.date;
        setFormData({
          projectId: editingEntry.projectId,
          taskId: editingEntry.taskId,
          allocatedHours: editingEntry.allocatedHours,
          date: entryDate,
        });
      } else if (selectedDate) {
        setFormData(prev => ({ ...prev, date: selectedDate }));
      }
    }
  }, [dispatch, open, selectedDate, editingEntry]);

  useEffect(() => {
    if (formData.projectId) {
      dispatch(fetchProjectTasks(formData.projectId));
    }
  }, [dispatch, formData.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      if (editingEntry) {
        // Update existing entry
        const updateData = {
          allocatedHours: formData.allocatedHours,
          date: formData.date.toISOString(),
        };
        
        console.log('Updating workload entry:', editingEntry.id, updateData);
        
        await apiClient.patch(`/workload/${editingEntry.id}`, updateData);
      } else {
        // Create new entry
        const allocationData = {
          userId: user.id,
          projectId: formData.projectId,
          taskId: formData.taskId,
          allocatedHours: formData.allocatedHours,
          date: formData.date.toISOString(),
        };
        
        console.log('Allocating workload:', allocationData);
        
        await apiClient.post('/workload/allocate', allocationData);
      }

      onSuccess?.();
      onClose();
      setFormData({
        projectId: '',
        taskId: '',
        allocatedHours: 8,
        date: selectedDate || new Date(),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${editingEntry ? 'update' : 'allocate'} workload`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      projectId: '',
      taskId: '',
      allocatedHours: 8,
      date: selectedDate || new Date(),
    });
    setError(null);
    onClose();
  };

  const filteredTasks = tasks.filter(task => task.projectId === formData.projectId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingEntry ? 'Edit Workload' : 'Allocate Workload'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required disabled={!!editingEntry}>
                    <InputLabel>Project</InputLabel>
                    <Select
                      value={formData.projectId}
                      label="Project"
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value, taskId: '' })}
                    >
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required disabled={!formData.projectId || !!editingEntry}>
                    <InputLabel>Task</InputLabel>
                    <Select
                      value={formData.taskId}
                      label="Task"
                      onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                    >
                      {filteredTasks.map((task) => (
                        <MenuItem key={task.id} value={task.id}>
                          {task.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Allocated Hours"
                    type="number"
                    value={formData.allocatedHours}
                    onChange={(e) => setFormData({ ...formData, allocatedHours: Number(e.target.value) })}
                    inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(date) => setFormData({ ...formData, date: date || new Date() })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This will {editingEntry ? 'update the allocation to' : 'allocate'} {formData.allocatedHours} hours of work for the selected task on the specified date.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !formData.projectId || !formData.taskId}
            >
              {loading ? (editingEntry ? 'Updating...' : 'Allocating...') : (editingEntry ? 'Update' : 'Allocate')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};