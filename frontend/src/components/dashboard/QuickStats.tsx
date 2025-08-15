import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { RootState } from '../../store';

export const QuickStats: React.FC = () => {
  const navigate = useNavigate();
  const stats = useDashboardStats();
  const { loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { loading: tasksLoading } = useSelector((state: RootState) => state.tasks);

  const isLoading = projectsLoading || tasksLoading;

  const statItems = [
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      total: stats.totalProjects,
      color: 'primary',
      icon: <TrendingUpIcon />,
    },
    {
      label: 'Tasks Due Today',
      value: stats.tasksDueToday,
      color: stats.tasksDueToday > 0 ? 'warning' : 'success',
      icon: <ScheduleIcon />,
    },
    {
      label: 'In Progress',
      value: stats.tasksInProgress,
      color: 'info',
      icon: <PlayArrowIcon />,
    },
    {
      label: 'Completed',
      value: stats.completedTasks,
      color: 'success',
      icon: <CheckCircleIcon />,
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Stats
        </Typography>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {statItems.map((item, index) => (
              <Grid item xs={6} key={index}>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    {React.cloneElement(item.icon, { 
                      color: item.color as any,
                      fontSize: 'small'
                    })}
                  </Box>
                  <Typography variant="h4" color={item.color as any} sx={{ fontWeight: 'bold' }}>
                    {item.value}
                    {item.total !== undefined && (
                      <Typography component="span" variant="body2" color="text.secondary">
                        /{item.total}
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {stats.overdueTasks > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <WarningIcon color="error" fontSize="small" />
              <Chip
                label={`${stats.overdueTasks} Overdue Task${stats.overdueTasks > 1 ? 's' : ''}`}
                color="error"
                size="small"
                variant="outlined"
              />
            </Box>
          </>
        )}

        {!isLoading && (
          <>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<TaskIcon />}
                onClick={() => navigate('/tasks/create')}
                fullWidth
              >
                Create Task
              </Button>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Button
                variant="text"
                onClick={() => navigate('/tasks')}
                fullWidth
                size="small"
              >
                View All Tasks ({stats.totalTasks})
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};