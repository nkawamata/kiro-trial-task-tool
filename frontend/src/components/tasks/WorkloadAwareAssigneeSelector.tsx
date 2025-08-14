import React, { useState, useEffect, useCallback } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { ProjectMemberWithUser } from './AssigneeSelector';
import { apiClient } from '../../services/apiClient';

interface AssignmentSuggestion {
  userId: string;
  userName: string;
  currentCapacity: number;
  availableCapacity: number;
  utilizationRate: number;
  recommendationScore: number;
  reason: string;
}

interface WorkloadImpact {
  currentWorkload: number;
  newWorkload: number;
  capacityUtilization: number;
  isOverAllocated: boolean;
  affectedDates: string[];
}

interface WorkloadAwareAssigneeSelectorProps {
  value?: string;
  onChange: (userId?: string) => void;
  projectMembers: ProjectMemberWithUser[];
  taskId?: string;
  loading?: boolean;
  disabled?: boolean;
  allowUnassigned?: boolean;
  showSuggestions?: boolean;
  showWorkloadImpact?: boolean;
}

export const WorkloadAwareAssigneeSelector: React.FC<WorkloadAwareAssigneeSelectorProps> = ({
  value,
  onChange,
  projectMembers,
  taskId,
  loading = false,
  disabled = false,
  allowUnassigned = true,
  showSuggestions = true,
  showWorkloadImpact = true
}) => {
  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [workloadImpact, setWorkloadImpact] = useState<WorkloadImpact | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState(false);

  const loadAssignmentSuggestions = useCallback(async () => {
    if (!taskId) return;

    setLoadingSuggestions(true);
    try {
      const response = await apiClient.get(`/tasks/${taskId}/assignment-suggestions`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to load assignment suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [taskId]);

  const loadWorkloadImpact = useCallback(async () => {
    if (!taskId || !value) return;

    setLoadingImpact(true);
    try {
      const response = await apiClient.get(`/tasks/${taskId}/workload-impact/${value}`);
      setWorkloadImpact(response.data.impact);
    } catch (error) {
      console.error('Failed to load workload impact:', error);
      setWorkloadImpact(null);
    } finally {
      setLoadingImpact(false);
    }
  }, [taskId, value]);

  // Load assignment suggestions when task is available
  useEffect(() => {
    if (taskId && showSuggestions && projectMembers.length > 0) {
      loadAssignmentSuggestions();
    }
  }, [taskId, showSuggestions, projectMembers, loadAssignmentSuggestions]);

  // Load workload impact when assignee is selected
  useEffect(() => {
    if (taskId && value && showWorkloadImpact) {
      loadWorkloadImpact();
    } else {
      setWorkloadImpact(null);
    }
  }, [taskId, value, showWorkloadImpact, loadWorkloadImpact]);

  const getSuggestionForUser = (userId: string): AssignmentSuggestion | undefined => {
    return suggestions.find(s => s.userId === userId);
  };

  const getCapacityColor = (utilizationRate: number): 'success' | 'warning' | 'error' => {
    if (utilizationRate < 0.8) return 'success';
    if (utilizationRate < 1.0) return 'warning';
    return 'error';
  };

  const getCapacityIcon = (utilizationRate: number) => {
    if (utilizationRate < 0.8) return <CheckCircleIcon fontSize="small" />;
    if (utilizationRate < 1.0) return <WarningIcon fontSize="small" />;
    return <ErrorIcon fontSize="small" />;
  };

  const renderMemberOption = (member: ProjectMemberWithUser) => {
    const suggestion = getSuggestionForUser(member.userId);
    const utilizationRate = suggestion?.utilizationRate || 0;
    const capacityColor = getCapacityColor(utilizationRate);

    return (
      <MenuItem key={member.userId} value={member.userId}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
            {member.user.name.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {member.user.name}
            </Typography>
            {suggestion && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(utilizationRate * 100, 100)}
                  color={capacityColor}
                  sx={{ flex: 1, height: 4, borderRadius: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(utilizationRate * 100)}%
                </Typography>
              </Box>
            )}
          </Box>

          {suggestion && (
            <Tooltip title={suggestion.reason}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getCapacityIcon(utilizationRate)}
                <Chip
                  label={`${Math.round(suggestion.recommendationScore)}`}
                  size="small"
                  color={capacityColor}
                  variant="outlined"
                />
              </Box>
            </Tooltip>
          )}
        </Box>
      </MenuItem>
    );
  };

  // Sort members by recommendation score if suggestions are available
  const sortedMembers = showSuggestions && suggestions.length > 0
    ? [...projectMembers].sort((a, b) => {
        const suggestionA = getSuggestionForUser(a.userId);
        const suggestionB = getSuggestionForUser(b.userId);
        return (suggestionB?.recommendationScore || 0) - (suggestionA?.recommendationScore || 0);
      })
    : projectMembers;

  return (
    <Box>
      <FormControl fullWidth disabled={disabled || loading}>
        <InputLabel>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon fontSize="small" />
            Assignee
            {loadingSuggestions && <CircularProgress size={12} />}
          </Box>
        </InputLabel>
        <Select
          value={value || ''}
          label="Assignee"
          onChange={(e) => onChange(e.target.value || undefined)}
          MenuProps={{
            PaperProps: {
              sx: { maxHeight: 300 }
            }
          }}
        >
          {allowUnassigned && (
            <MenuItem value="">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="disabled" />
                <Typography color="text.secondary">Unassigned</Typography>
              </Box>
            </MenuItem>
          )}
          
          {sortedMembers.map(renderMemberOption)}
        </Select>
      </FormControl>

      {/* Workload Impact Preview */}
      {showWorkloadImpact && workloadImpact && (
        <Box sx={{ mt: 2 }}>
          {loadingImpact ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Calculating workload impact...
              </Typography>
            </Box>
          ) : (
            <Alert 
              severity={workloadImpact.isOverAllocated ? 'warning' : 'info'}
              sx={{ fontSize: '0.875rem' }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Workload Impact:</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2">
                  Current: {workloadImpact.currentWorkload}h → New: {workloadImpact.newWorkload}h
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Capacity: {Math.round(workloadImpact.capacityUtilization * 100)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(workloadImpact.capacityUtilization * 100, 100)}
                    color={workloadImpact.isOverAllocated ? 'error' : 'primary'}
                    sx={{ flex: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
                {workloadImpact.isOverAllocated && (
                  <Typography variant="body2" color="warning.main">
                    ⚠️ This assignment may overload the team member
                  </Typography>
                )}
              </Box>
            </Alert>
          )}
        </Box>
      )}

      {/* Assignment Suggestions Summary */}
      {showSuggestions && suggestions.length > 0 && !value && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            💡 Recommended assignees (sorted by availability):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestions.slice(0, 3).map((suggestion) => {
              const color = getCapacityColor(suggestion.utilizationRate);
              return (
                <Tooltip key={suggestion.userId} title={suggestion.reason}>
                  <Chip
                    label={`${suggestion.userName} (${Math.round(suggestion.recommendationScore)})`}
                    size="small"
                    color={color}
                    variant="outlined"
                    onClick={() => onChange(suggestion.userId)}
                    clickable
                  />
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};