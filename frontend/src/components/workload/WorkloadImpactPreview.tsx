import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

interface WorkloadImpact {
  currentWorkload: number;
  newWorkload: number;
  capacityUtilization: number;
  isOverAllocated: boolean;
  affectedDates: string[];
}

interface WorkloadImpactPreviewProps {
  taskId: string;
  assigneeId: string;
  onImpactCalculated?: (impact: WorkloadImpact) => void;
}

export const WorkloadImpactPreview: React.FC<WorkloadImpactPreviewProps> = ({
  taskId,
  assigneeId,
  onImpactCalculated
}) => {
  const [impact, setImpact] = useState<WorkloadImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkloadImpact = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/tasks/${taskId}/workload-impact/${assigneeId}`);
      const impactData = response.data.impact;
      setImpact(impactData);
      onImpactCalculated?.(impactData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate workload impact');
      setImpact(null);
    } finally {
      setLoading(false);
    }
  }, [taskId, assigneeId, onImpactCalculated]);

  useEffect(() => {
    if (taskId && assigneeId) {
      loadWorkloadImpact();
    } else {
      setImpact(null);
      setError(null);
    }
  }, [taskId, assigneeId, loadWorkloadImpact]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Calculating workload impact...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {error}
      </Alert>
    );
  }

  if (!impact) {
    return null;
  }

  const getSeverity = (): 'success' | 'warning' | 'error' => {
    if (impact.isOverAllocated) return 'error';
    if (impact.capacityUtilization > 0.8) return 'warning';
    return 'success';
  };

  const getCapacityColor = (): 'success' | 'warning' | 'error' => {
    if (impact.capacityUtilization < 0.8) return 'success';
    if (impact.capacityUtilization < 1.0) return 'warning';
    return 'error';
  };

  const getStatusIcon = () => {
    if (impact.isOverAllocated) return <WarningIcon color="error" />;
    if (impact.capacityUtilization > 0.8) return <WarningIcon color="warning" />;
    return <CheckCircleIcon color="success" />;
  };

  const getStatusMessage = () => {
    if (impact.isOverAllocated) {
      return 'This assignment will overload the team member';
    }
    if (impact.capacityUtilization > 0.9) {
      return 'Team member will be at near-full capacity';
    }
    if (impact.capacityUtilization > 0.8) {
      return 'Team member will have high utilization';
    }
    return 'Team member has good availability for this task';
  };

  const workloadIncrease = impact.newWorkload - impact.currentWorkload;
  const utilizationPercentage = Math.round(impact.capacityUtilization * 100);

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUpIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" color="primary">
            Workload Impact Analysis
          </Typography>
        </Box>

        <Alert severity={getSeverity()} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon()}
            <Typography variant="body2">
              {getStatusMessage()}
            </Typography>
          </Box>
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Workload Change
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  {impact.currentWorkload}h → {impact.newWorkload}h
                </Typography>
                <Chip
                  label={`+${workloadIncrease}h`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Capacity Utilization
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(utilizationPercentage, 100)}
                  color={getCapacityColor()}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" fontWeight="medium">
                  {utilizationPercentage}%
                </Typography>
              </Box>
            </Box>
          </Grid>

          {impact.affectedDates.length > 0 && (
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <ScheduleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                  Affected Timeline
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {impact.affectedDates.length} day{impact.affectedDates.length !== 1 ? 's' : ''}
                  </Typography>
                  <Tooltip title={`From ${impact.affectedDates[0]} to ${impact.affectedDates[impact.affectedDates.length - 1]}`}>
                    <Chip
                      label={`${new Date(impact.affectedDates[0]).toLocaleDateString()} - ${new Date(impact.affectedDates[impact.affectedDates.length - 1]).toLocaleDateString()}`}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>

        {impact.isOverAllocated && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark">
              💡 <strong>Suggestion:</strong> Consider redistributing work or extending the timeline to prevent overallocation.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};