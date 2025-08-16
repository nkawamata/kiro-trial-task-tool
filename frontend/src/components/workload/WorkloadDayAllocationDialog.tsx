import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { RootState, AppDispatch } from '../../store';
import { fetchWorkloadEntries } from '../../store/slices/workloadSlice';
import { fetchProjectTasks } from '../../store/slices/tasksSlice';
import { fetchProjects } from '../../store/slices/projectsSlice';
import { WorkloadAllocationDialog } from './WorkloadAllocationDialog';
import { apiClient } from '../../services/apiClient';
import { WorkloadEntry } from '@task-manager/shared';

interface WorkloadDayAllocationDialogProps {
  open: boolean;
  selectedDate: Date | null;
  userId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WorkloadDayAllocationDialog: React.FC<WorkloadDayAllocationDialogProps> = ({
  open,
  selectedDate,
  userId: propUserId,
  onClose,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { entries, loading } = useSelector((state: RootState) => state.workload);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { projects } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);

  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkloadEntry | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use provided userId or fall back to current user
  const knownUserId = '662b8362-d1e6-401c-9936-396f77003a11';
  const targetUserId = propUserId || user?.id || knownUserId;

  // Get entries for the selected date
  const dayEntries = useMemo(() => {
    if (!selectedDate) return [];
    
    return entries.filter(entry => {
      const entryDateString = typeof entry.date === 'string' 
        ? (entry.date.includes('T') ? format(new Date(entry.date), 'yyyy-MM-dd') : entry.date)
        : format(new Date(entry.date), 'yyyy-MM-dd');
      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
      return entry.userId === targetUserId && entryDateString === selectedDateString;
    });
  }, [selectedDate, entries, targetUserId]);

  // Calculate total hours for the day
  const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.allocatedHours || 0), 0);

  useEffect(() => {
    if (open && selectedDate && targetUserId) {
      // Fetch data for the selected date
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      dispatch(fetchWorkloadEntries({ 
        startDate: dateString, 
        endDate: dateString, 
        userId: targetUserId 
      }));
      dispatch(fetchProjects());
    }
  }, [dispatch, open, selectedDate, targetUserId]);

  // Fetch tasks for projects that have workload entries
  useEffect(() => {
    if (dayEntries.length > 0) {
      const projectIds = dayEntries.map(entry => entry.projectId);
      const uniqueProjectIds = Array.from(new Set(projectIds));
      uniqueProjectIds.forEach(projectId => {
        dispatch(fetchProjectTasks(projectId));
      });
    }
  }, [dispatch, dayEntries]);

  const getTaskName = (taskId: string): string => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const handleDeleteEntry = async (entryId: string) => {
    setDeleting(entryId);
    setError(null);
    
    try {
      await apiClient.delete(`/workload/${entryId}`);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete workload entry');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditEntry = (entry: WorkloadEntry) => {
    setEditingEntry(entry);
    setAllocationDialogOpen(true);
  };

  const handleAddAllocation = () => {
    setEditingEntry(null);
    setAllocationDialogOpen(true);
  };

  const handleAllocationSuccess = () => {
    setAllocationDialogOpen(false);
    setEditingEntry(null);
    onSuccess?.();
  };

  const getWorkloadColor = (hours: number) => {
    if (hours === 0) return 'default';
    if (hours <= 4) return 'success';
    if (hours <= 6) return 'info';
    if (hours <= 8) return 'warning';
    return 'error';
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Workload for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
            </Typography>
            <Chip
              label={`${totalHours}h total`}
              color={getWorkloadColor(totalHours)}
              variant="outlined"
            />
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {dayEntries.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No workload allocated for this date
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddAllocation}
                    sx={{ mt: 2 }}
                  >
                    Add Allocation
                  </Button>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Allocated Tasks ({dayEntries.length})
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddAllocation}
                    >
                      Add More
                    </Button>
                  </Box>

                  <List>
                    {dayEntries.map((entry, index) => (
                      <React.Fragment key={entry.id}>
                        <ListItem
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            backgroundColor: 'background.paper',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {getTaskName(entry.taskId)}
                                </Typography>
                                <Chip
                                  label={`${entry.allocatedHours}h`}
                                  size="small"
                                  color={getWorkloadColor(entry.allocatedHours)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Project: {getProjectName(entry.projectId)}
                                </Typography>
                                {entry.actualHours !== undefined && (
                                  <Typography variant="body2" color="text.secondary">
                                    Actual: {entry.actualHours}h
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleEditEntry(entry)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={deleting === entry.id}
                              color="error"
                            >
                              {deleting === entry.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < dayEntries.length - 1 && <Divider sx={{ my: 1 }} />}
                      </React.Fragment>
                    ))}
                  </List>

                  <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Daily Summary:</strong> {totalHours} hours allocated
                      {totalHours > 8 && (
                        <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                          (Over capacity)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <WorkloadAllocationDialog
        open={allocationDialogOpen}
        selectedDate={selectedDate}
        editingEntry={editingEntry}
        preselectedUserId={targetUserId}
        onClose={() => {
          setAllocationDialogOpen(false);
          setEditingEntry(null);
        }}
        onSuccess={handleAllocationSuccess}
      />
    </>
  );
};