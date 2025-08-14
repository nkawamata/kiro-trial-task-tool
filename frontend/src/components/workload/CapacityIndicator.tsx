import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Tooltip,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

interface CapacityInfo {
  userId: string;
  userName: string;
  totalCapacity: number;
  allocatedHours: number;
  availableHours: number;
  utilizationRate: number;
  isOverAllocated: boolean;
}

interface CapacityIndicatorProps {
  userId: string;
  userName?: string;
  startDate?: Date;
  endDate?: Date;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'compact' | 'detailed';
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  userId,
  userName,
  startDate,
  endDate,
  showDetails = true,
  size = 'medium',
  variant = 'detailed'
}) => {
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCapacityInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await apiClient.get(`/tasks/capacity/${userId}?${params.toString()}`);
      setCapacity(response.data.capacity);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load capacity info');
      setCapacity(null);
    } finally {
      setLoading(false);
    }
  }, [userId, startDate, endDate]);

  useEffect(() => {
    if (userId) {
      loadCapacityInfo();
    }
  }, [userId, startDate, endDate, loadCapacityInfo]);

  const getCapacityColor = (utilizationRate: number): 'success' | 'warning' | 'error' => {
    if (utilizationRate < 0.8) return 'success';
    if (utilizationRate < 1.0) return 'warning';
    return 'error';
  };

  const getCapacityIcon = (utilizationRate: number) => {
    const iconSize = size === 'small' ? 'small' : 'medium';
    if (utilizationRate < 0.8) return <CheckCircleIcon color="success" fontSize={iconSize} />;
    if (utilizationRate < 1.0) return <WarningIcon color="warning" fontSize={iconSize} />;
    return <ErrorIcon color="error" fontSize={iconSize} />;
  };

  const getStatusText = (utilizationRate: number): string => {
    if (utilizationRate < 0.5) return 'Available';
    if (utilizationRate < 0.8) return 'Moderate';
    if (utilizationRate < 1.0) return 'Busy';
    return 'Overloaded';
  };

  const getProgressHeight = () => {
    switch (size) {
      case 'small': return 4;
      case 'large': return 8;
      default: return 6;
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case 'small': return 'caption';
      case 'large': return 'body1';
      default: return 'body2';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={size === 'small' ? 16 : 20} />
        <Typography variant={getTypographyVariant()} color="text.secondary">
          Loading capacity...
        </Typography>
      </Box>
    );
  }

  if (error || !capacity) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="disabled" fontSize={size === 'small' ? 'small' : 'medium'} />
        <Typography variant={getTypographyVariant()} color="text.secondary">
          {userName || 'Unknown User'}
        </Typography>
      </Box>
    );
  }

  const utilizationPercentage = Math.round(capacity.utilizationRate * 100);
  const capacityColor = getCapacityColor(capacity.utilizationRate);
  const statusText = getStatusText(capacity.utilizationRate);

  if (variant === 'compact') {
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {capacity.userName}
            </Typography>
            <Typography variant="body2">
              Capacity: {capacity.allocatedHours}h / {capacity.totalCapacity}h ({utilizationPercentage}%)
            </Typography>
            <Typography variant="body2">
              Available: {capacity.availableHours}h
            </Typography>
            <Typography variant="body2">
              Status: {statusText}
            </Typography>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
            {capacity.userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getCapacityIcon(capacity.utilizationRate)}
            <Chip
              label={`${utilizationPercentage}%`}
              size="small"
              color={capacityColor}
              variant="outlined"
            />
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar sx={{ width: size === 'small' ? 20 : 24, height: size === 'small' ? 20 : 24, fontSize: '0.75rem' }}>
          {capacity.userName.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant={getTypographyVariant()} sx={{ fontWeight: 'medium' }}>
          {capacity.userName}
        </Typography>
        {getCapacityIcon(capacity.utilizationRate)}
        <Chip
          label={statusText}
          size="small"
          color={capacityColor}
          variant="outlined"
        />
      </Box>

      {showDetails && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(utilizationPercentage, 100)}
              color={capacityColor}
              sx={{ flex: 1, height: getProgressHeight(), borderRadius: 2 }}
            />
            <Typography variant={getTypographyVariant()} sx={{ minWidth: 'fit-content' }}>
              {utilizationPercentage}%
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {capacity.allocatedHours}h allocated
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {capacity.availableHours}h available
            </Typography>
          </Box>

          {capacity.isOverAllocated && (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
              ⚠️ Over-allocated by {Math.round((capacity.utilizationRate - 1) * capacity.totalCapacity)}h
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};