import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { WorkloadSummary as WorkloadSummaryType } from '@task-manager/shared';

interface WorkloadSummaryProps {
  summary: WorkloadSummaryType | null;
  distribution: any;
  teamWorkload: WorkloadSummaryType[];
}

export const WorkloadSummary: React.FC<WorkloadSummaryProps> = ({
  summary,
  distribution,
  teamWorkload,
}) => {
  const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency > 100) return 'error';
    if (efficiency > 90) return 'warning';
    if (efficiency > 80) return 'success';
    return 'info';
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'info';
    return 'success';
  };

  const overallEfficiency = summary && summary.totalAllocatedHours > 0
    ? (summary.totalActualHours / summary.totalAllocatedHours) * 100
    : 0;

  const capacityUtilization = distribution && distribution.totalCapacity > 0
    ? (distribution.allocated / distribution.totalCapacity) * 100
    : 0;

  return (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <ScheduleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" component="div">
                  {distribution ? formatHours(distribution.allocated) : '0h'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Allocated This Week
                </Typography>
              </Box>
            </Box>
            {distribution && (
              <LinearProgress
                variant="determinate"
                value={capacityUtilization}
                color={getCapacityColor(capacityUtilization)}
                sx={{ height: 6, borderRadius: 3 }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" component="div">
                  {summary ? summary.projects.length : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Projects
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${summary ? summary.projects.length : 0} projects`}
              color="secondary"
              size="small"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: getEfficiencyColor(overallEfficiency) + '.main', mr: 2 }}>
                {overallEfficiency > 100 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              </Avatar>
              <Box>
                <Typography variant="h6" component="div">
                  {overallEfficiency.toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Efficiency
                </Typography>
              </Box>
            </Box>
            <Chip
              label={overallEfficiency > 100 ? 'Over capacity' : 'Under capacity'}
              color={getEfficiencyColor(overallEfficiency)}
              size="small"
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" component="div">
                  {teamWorkload.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Team Members
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${teamWorkload.length} active`}
              color="info"
              size="small"
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Project Breakdown */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Workload Breakdown
            </Typography>
            {summary && summary.projects.length > 0 ? (
              <List>
                {summary.projects.map((project, index) => {
                  const efficiency = project.allocatedHours > 0
                    ? (project.actualHours / project.allocatedHours) * 100
                    : 0;
                  const variance = project.actualHours - project.allocatedHours;

                  return (
                    <React.Fragment key={project.projectId}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getEfficiencyColor(efficiency) + '.main' }}>
                            {project.projectName.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={project.projectName}
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                  Allocated: {formatHours(project.allocatedHours)}
                                </Typography>
                                <Typography variant="body2">
                                  Actual: {formatHours(project.actualHours)}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(efficiency, 100)}
                                color={getEfficiencyColor(efficiency)}
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Chip
                                  label={`${efficiency.toFixed(0)}% efficiency`}
                                  color={getEfficiencyColor(efficiency)}
                                  size="small"
                                />
                                <Chip
                                  label={`${variance >= 0 ? '+' : ''}${formatHours(variance)} variance`}
                                  color={variance > 0 ? 'warning' : variance < 0 ? 'info' : 'default'}
                                  size="small"
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < summary.projects.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No project data available for the selected period
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Capacity Overview */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Capacity Overview
            </Typography>
            {distribution ? (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Weekly Capacity
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {formatHours(distribution.totalCapacity)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Allocated</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatHours(distribution.allocated)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={capacityUtilization}
                    color={getCapacityColor(capacityUtilization)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Available</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatHours(distribution.available)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${capacityUtilization.toFixed(0)}% Utilized`}
                    color={getCapacityColor(capacityUtilization)}
                    size="small"
                  />
                  {capacityUtilization > 90 && (
                    <Chip
                      label="Over capacity"
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Loading capacity data...
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};