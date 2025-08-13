import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  SwapHoriz as SwapIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { apiClient } from '../../services/apiClient';

interface WorkloadQuickActionsProps {
  onRefresh: () => void;
  onAllocateWork: () => void;
}

export const WorkloadQuickActions: React.FC<WorkloadQuickActionsProps> = ({
  onRefresh,
  onAllocateWork,
}) => {
  const { projects } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);

  const [bulkAllocationOpen, setBulkAllocationOpen] = useState(false);
  const [redistributeOpen, setRedistributeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bulkAllocationData, setBulkAllocationData] = useState({
    projectId: '',
    hoursPerDay: 8,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [redistributeData, setRedistributeData] = useState({
    fromProjectId: '',
    toProjectId: '',
    hours: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const handleBulkAllocation = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/workload/bulk-allocate', {
        userId: user.id,
        projectId: bulkAllocationData.projectId,
        hoursPerDay: bulkAllocationData.hoursPerDay,
        startDate: bulkAllocationData.startDate,
        endDate: bulkAllocationData.endDate,
      });

      setBulkAllocationOpen(false);
      setBulkAllocationData({
        projectId: '',
        hoursPerDay: 8,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bulk allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleRedistribute = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/workload/redistribute', {
        userId: user.id,
        fromProjectId: redistributeData.fromProjectId,
        toProjectId: redistributeData.toProjectId,
        hours: redistributeData.hours,
        date: redistributeData.date,
      });

      setRedistributeOpen(false);
      setRedistributeData({
        fromProjectId: '',
        toProjectId: '',
        hours: 0,
        date: new Date().toISOString().split('T')[0],
      });
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to redistribute workload');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Allocate Work',
      description: 'Add new work allocation',
      icon: <AddIcon />,
      color: 'primary',
      action: onAllocateWork,
    },
    {
      title: 'Bulk Allocation',
      description: 'Allocate hours across multiple days',
      icon: <ScheduleIcon />,
      color: 'secondary',
      action: () => setBulkAllocationOpen(true),
    },
    {
      title: 'Redistribute',
      description: 'Move hours between projects',
      icon: <SwapIcon />,
      color: 'info',
      action: () => setRedistributeOpen(true),
    },
    {
      title: 'Generate Report',
      description: 'Export workload summary',
      icon: <AssessmentIcon />,
      color: 'success',
      action: () => {
        // TODO: Implement report generation
        console.log('Generate report clicked');
      },
    },
    {
      title: 'Refresh Data',
      description: 'Update all workload information',
      icon: <RefreshIcon />,
      color: 'default',
      action: onRefresh,
    },
  ];

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                  onClick={action.action}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{ color: `${action.color}.main`, mb: 1 }}>
                      {action.icon}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Bulk Allocation Dialog */}
      <Dialog open={bulkAllocationOpen} onClose={() => setBulkAllocationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Work Allocation</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={bulkAllocationData.projectId}
                    label="Project"
                    onChange={(e) => setBulkAllocationData({ ...bulkAllocationData, projectId: e.target.value })}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Hours per Day"
                  type="number"
                  value={bulkAllocationData.hoursPerDay}
                  onChange={(e) => setBulkAllocationData({ ...bulkAllocationData, hoursPerDay: Number(e.target.value) })}
                  inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={bulkAllocationData.startDate}
                  onChange={(e) => setBulkAllocationData({ ...bulkAllocationData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={bulkAllocationData.endDate}
                  onChange={(e) => setBulkAllocationData({ ...bulkAllocationData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This will allocate {bulkAllocationData.hoursPerDay} hours per day for the selected project 
              from {bulkAllocationData.startDate} to {bulkAllocationData.endDate}.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkAllocationOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkAllocation}
            variant="contained"
            disabled={loading || !bulkAllocationData.projectId}
          >
            {loading ? 'Allocating...' : 'Allocate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redistribute Dialog */}
      <Dialog open={redistributeOpen} onClose={() => setRedistributeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Redistribute Workload</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>From Project</InputLabel>
                  <Select
                    value={redistributeData.fromProjectId}
                    label="From Project"
                    onChange={(e) => setRedistributeData({ ...redistributeData, fromProjectId: e.target.value })}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>To Project</InputLabel>
                  <Select
                    value={redistributeData.toProjectId}
                    label="To Project"
                    onChange={(e) => setRedistributeData({ ...redistributeData, toProjectId: e.target.value })}
                  >
                    {projects.filter(p => p.id !== redistributeData.fromProjectId).map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hours to Move"
                  type="number"
                  value={redistributeData.hours}
                  onChange={(e) => setRedistributeData({ ...redistributeData, hours: Number(e.target.value) })}
                  inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={redistributeData.date}
                  onChange={(e) => setRedistributeData({ ...redistributeData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This will move {redistributeData.hours} hours from the source project to the target project 
              on {redistributeData.date}.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedistributeOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRedistribute}
            variant="contained"
            disabled={loading || !redistributeData.fromProjectId || !redistributeData.toProjectId}
          >
            {loading ? 'Redistributing...' : 'Redistribute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};