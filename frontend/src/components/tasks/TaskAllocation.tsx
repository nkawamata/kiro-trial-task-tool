import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { WorkloadEntry, User } from '@task-manager/shared';
import { WorkloadService } from '../../services/workloadService';
import { userService } from '../../services/userService';
import { WorkloadAllocationDialog } from '../workload/WorkloadAllocationDialog';

interface TaskAllocationProps {
  taskId: string;
  assigneeId?: string;
  assignee?: User;
}

interface AllocationRow extends WorkloadEntry {
  isEditing?: boolean;
  tempActualHours?: number;
  allocatedForUser?: User;
}

export const TaskAllocation: React.FC<TaskAllocationProps> = ({ taskId, assigneeId, assignee }) => {
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<string>(''); // ID of the allocation being saved
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkloadEntry | null>(null);

  useEffect(() => {
    loadTaskAllocations();
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTaskAllocations = async () => {
    setLoading(true);
    setError('');

    try {
      // Get allocations for the past 3 months and next 3 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const taskAllocations = await WorkloadService.getAllTaskWorkloadEntries(
        taskId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Load user information for each allocation's userId (who it's allocated for)
      const allocationsWithUsers = await Promise.all(
        taskAllocations.map(async (allocation) => {
          let allocatedForUser: User | undefined;
          try {
            // First try to get user by database ID
            allocatedForUser = await userService.getUser(allocation.userId);
            console.log('Loaded user for allocation:', allocation.userId, allocatedForUser);
          } catch (err) {
            console.warn('Failed to load user info for allocation:', allocation.userId, err);
            // If that fails, the userId might be a Cognito ID from old data
            // For now, we'll just show a fallback display
          }
          return { ...allocation, isEditing: false, allocatedForUser };
        })
      );

      setAllocations(allocationsWithUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load task allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleEditActualHours = (allocationId: string) => {
    setAllocations(prev => prev.map(allocation => 
      allocation.id === allocationId 
        ? { 
            ...allocation, 
            isEditing: true, 
            tempActualHours: allocation.actualHours || 0 
          }
        : allocation
    ));
  };

  const handleCancelEdit = (allocationId: string) => {
    setAllocations(prev => prev.map(allocation => 
      allocation.id === allocationId 
        ? { 
            ...allocation, 
            isEditing: false, 
            tempActualHours: undefined 
          }
        : allocation
    ));
  };

  const handleActualHoursChange = (allocationId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAllocations(prev => prev.map(allocation => 
      allocation.id === allocationId 
        ? { ...allocation, tempActualHours: numValue }
        : allocation
    ));
  };

  const handleSaveActualHours = async (allocationId: string) => {
    const allocation = allocations.find(a => a.id === allocationId);
    if (!allocation || allocation.tempActualHours === undefined) return;

    setSaving(allocationId);
    try {
      const updatedAllocation = await WorkloadService.updateWorkloadActualHours(
        allocationId,
        allocation.tempActualHours
      );

      setAllocations(prev => prev.map(a => 
        a.id === allocationId 
          ? { 
              ...updatedAllocation, 
              isEditing: false, 
              tempActualHours: undefined 
            }
          : a
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update actual hours');
    } finally {
      setSaving('');
    }
  };

  const getTotalAllocatedHours = () => {
    return allocations.reduce((total, allocation) => total + allocation.allocatedHours, 0);
  };

  const getTotalActualHours = () => {
    return allocations.reduce((total, allocation) => total + (allocation.actualHours || 0), 0);
  };

  const getVariance = () => {
    const allocated = getTotalAllocatedHours();
    const actual = getTotalActualHours();
    return actual - allocated;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'success';
    if (variance > 0) return 'warning';
    return 'info';
  };

  const handleAddAllocation = () => {
    setEditingEntry(null);
    setAllocationDialogOpen(true);
  };

  const handleEditAllocation = (allocation: WorkloadEntry) => {
    setEditingEntry(allocation);
    setAllocationDialogOpen(true);
  };

  const handleAllocationSuccess = () => {
    setAllocationDialogOpen(false);
    setEditingEntry(null);
    loadTaskAllocations(); // Reload allocations after successful creation/update
  };



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadTaskAllocations}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (allocations.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon fontSize="small" />
            <Typography variant="h6">Task Allocation</Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddAllocation}
          >
            Add Allocation
          </Button>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="info"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleAddAllocation}
                startIcon={<AddIcon />}
              >
                Create First Allocation
              </Button>
            }
          >
            No workload allocations found for this task. Create allocations to track time and resources.
          </Alert>
        </Box>

        <WorkloadAllocationDialog
          open={allocationDialogOpen}
          selectedDate={null}
          editingEntry={editingEntry}
          preselectedTaskId={taskId}
          preselectedUserId={assigneeId}
          onClose={() => {
            setAllocationDialogOpen(false);
            setEditingEntry(null);
          }}
          onSuccess={handleAllocationSuccess}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon fontSize="small" />
          <Typography variant="h6">Task Allocation</Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddAllocation}
        >
          Add Allocation
        </Button>
      </Box>

      {/* Assignee Information */}
      {assignee && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Assigned to: {assignee.name || assignee.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assignee.email}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">Total Allocated</Typography>
          <Typography variant="h6">{getTotalAllocatedHours()}h</Typography>
          <Typography variant="caption" color="text.secondary">
            Across {allocations.length} allocation{allocations.length !== 1 ? 's' : ''}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">Total Actual</Typography>
          <Typography variant="h6">{getTotalActualHours()}h</Typography>
          <Typography variant="caption" color="text.secondary">
            {assignee ? `Logged by ${assignee.name || assignee.email}` : 'Time logged'}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">Variance</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {getVariance() > 0 ? '+' : ''}{getVariance()}h
            </Typography>
            <Chip 
              size="small" 
              label={getVariance() === 0 ? 'On Track' : getVariance() > 0 ? 'Over' : 'Under'}
              color={getVarianceColor(getVariance())}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {getVariance() === 0 ? 'Perfect match' : 
             getVariance() > 0 ? 'Over allocated' : 'Under allocated'}
          </Typography>
        </Paper>
      </Box>

      {/* Allocation Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Allocated For</TableCell>
              <TableCell align="right">Allocated Hours</TableCell>
              <TableCell align="right">Actual Hours</TableCell>
              <TableCell align="right">Variance</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allocations.map((allocation) => {
              const variance = (allocation.actualHours || 0) - allocation.allocatedHours;
              return (
                <TableRow key={allocation.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      {formatDate(allocation.date)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {allocation.allocatedForUser?.name || 
                           allocation.allocatedForUser?.email || 
                           `User (${allocation.userId.substring(0, 8)}...)`}
                        </Typography>
                        {allocation.allocatedForUser && (
                          <Typography variant="caption" color="text.secondary">
                            {allocation.allocatedForUser.email || allocation.allocatedForUser.name ? 
                             allocation.allocatedForUser.email : 
                             `ID: ${allocation.userId.substring(0, 12)}...`}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{allocation.allocatedHours}h</TableCell>
                  <TableCell align="right">
                    {allocation.isEditing ? (
                      <TextField
                        size="small"
                        type="number"
                        value={allocation.tempActualHours || 0}
                        onChange={(e) => handleActualHoursChange(allocation.id, e.target.value)}
                        inputProps={{ min: 0, step: 0.5 }}
                        sx={{ width: 80 }}
                      />
                    ) : (
                      `${allocation.actualHours || 0}h`
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      color={variance === 0 ? 'text.primary' : variance > 0 ? 'warning.main' : 'info.main'}
                    >
                      {variance > 0 ? '+' : ''}{variance}h
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {allocation.isEditing ? (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Save">
                          <IconButton
                            size="small"
                            onClick={() => handleSaveActualHours(allocation.id)}
                            disabled={saving === allocation.id}
                          >
                            {saving === allocation.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <SaveIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelEdit(allocation.id)}
                            disabled={saving === allocation.id}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit allocation">
                          <IconButton
                            size="small"
                            onClick={() => handleEditAllocation(allocation)}
                          >
                            <ScheduleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit actual hours">
                          <IconButton
                            size="small"
                            onClick={() => handleEditActualHours(allocation.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Activity Summary */}
      {allocations.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Allocation Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Date Range
              </Typography>
              <Typography variant="body2">
                {formatDate(new Date(Math.min(...allocations.map(a => new Date(a.date).getTime()))))} - {' '}
                {formatDate(new Date(Math.max(...allocations.map(a => new Date(a.date).getTime()))))}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Average Daily Allocation
              </Typography>
              <Typography variant="body2">
                {(getTotalAllocatedHours() / allocations.length).toFixed(1)}h per day
              </Typography>
            </Box>
            {assignee && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Efficiency Rate
                </Typography>
                <Typography variant="body2">
                  {getTotalAllocatedHours() > 0 
                    ? ((getTotalActualHours() / getTotalAllocatedHours()) * 100).toFixed(1)
                    : '0'}%
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Tip: You can create new allocations or edit existing ones using the buttons above. Edit actual hours to track time spent.
          {assignee && ` All time entries are attributed to ${assignee.name || assignee.email}.`}
        </Typography>
      </Box>

      <WorkloadAllocationDialog
        open={allocationDialogOpen}
        selectedDate={null}
        editingEntry={editingEntry}
        preselectedTaskId={taskId}
        preselectedUserId={assigneeId}
        onClose={() => {
          setAllocationDialogOpen(false);
          setEditingEntry(null);
        }}
        onSuccess={handleAllocationSuccess}
      />
    </Box>
  );
};