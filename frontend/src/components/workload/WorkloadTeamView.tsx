import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { WorkloadSummary } from '@task-manager/shared';

interface WorkloadTeamViewProps {
  teamWorkload: WorkloadSummary[];
  selectedProject: string;
}

export const WorkloadTeamView: React.FC<WorkloadTeamViewProps> = ({
  teamWorkload,
  selectedProject,
}) => {
  const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 120) return 'error';
    if (utilization > 100) return 'warning';
    if (utilization > 80) return 'success';
    if (utilization > 60) return 'info';
    return 'default';
  };

  const getLinearProgressColor = (utilization: number): 'error' | 'warning' | 'success' | 'info' | 'primary' => {
    if (utilization > 120) return 'error';
    if (utilization > 100) return 'warning';
    if (utilization > 80) return 'success';
    if (utilization > 60) return 'info';
    return 'primary';
  };

  const getUtilizationIcon = (utilization: number) => {
    if (utilization > 100) return <TrendingUpIcon />;
    if (utilization < 60) return <TrendingDownIcon />;
    return <PersonIcon />;
  };

  const sortedTeamWorkload = [...teamWorkload].sort((a, b) => {
    const utilizationA = a.totalAllocatedHours > 0 
      ? (a.totalActualHours / a.totalAllocatedHours) * 100 
      : 0;
    const utilizationB = b.totalAllocatedHours > 0 
      ? (b.totalActualHours / b.totalAllocatedHours) * 100 
      : 0;
    return utilizationB - utilizationA;
  });

  const overloadedMembers = teamWorkload.filter(member => {
    const utilization = member.totalAllocatedHours > 0 
      ? (member.totalActualHours / member.totalAllocatedHours) * 100 
      : 0;
    return utilization > 120;
  });

  const underutilizedMembers = teamWorkload.filter(member => {
    const utilization = member.totalAllocatedHours > 0 
      ? (member.totalActualHours / member.totalAllocatedHours) * 100 
      : 0;
    return utilization < 60 && member.totalAllocatedHours > 0;
  });

  if (selectedProject === 'all') {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Team Workload
          </Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            Please select a specific project to view team workload distribution.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (teamWorkload.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Team Workload
          </Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            No team workload data available for the selected project and period.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Team Overview Cards */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Team Overview
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" color="primary.main">
                {teamWorkload.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Team Members
              </Typography>
            </Box>

            {overloadedMembers.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  icon={<WarningIcon />}
                  label={`${overloadedMembers.length} Overloaded`}
                  color="error"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Members working over 120% capacity
                </Typography>
              </Box>
            )}

            {underutilizedMembers.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`${underutilizedMembers.length} Available`}
                  color="info"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Members with additional capacity
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Team Member Cards */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Individual Workload
            </Typography>
            
            <List>
              {sortedTeamWorkload.map((member, index) => {
                const utilization = member.totalAllocatedHours > 0 
                  ? (member.totalActualHours / member.totalAllocatedHours) * 100 
                  : 0;
                const variance = member.totalActualHours - member.totalAllocatedHours;

                return (
                  <React.Fragment key={member.userId}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getUtilizationColor(utilization) + '.main' }}>
                          {getUtilizationIcon(utilization)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {member.userName}
                            </Typography>
                            <Chip
                              label={`${utilization.toFixed(0)}%`}
                              color={getUtilizationColor(utilization)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Allocated: {formatHours(member.totalAllocatedHours)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Actual: {formatHours(member.totalActualHours)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(utilization, 100)}
                              color={getLinearProgressColor(utilization)}
                              sx={{ height: 6, borderRadius: 3, mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                Utilization: {utilization.toFixed(0)}%
                              </Typography>
                              <Chip
                                label={`${variance >= 0 ? '+' : ''}${formatHours(variance)}`}
                                color={variance > 0 ? 'warning' : variance < 0 ? 'info' : 'default'}
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < sortedTeamWorkload.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Detailed Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Team Workload
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Team Member</TableCell>
                    <TableCell align="right">Allocated Hours</TableCell>
                    <TableCell align="right">Actual Hours</TableCell>
                    <TableCell align="right">Utilization</TableCell>
                    <TableCell align="right">Variance</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedTeamWorkload.map((member) => {
                    const utilization = member.totalAllocatedHours > 0 
                      ? (member.totalActualHours / member.totalAllocatedHours) * 100 
                      : 0;
                    const variance = member.totalActualHours - member.totalAllocatedHours;
                    
                    return (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: getUtilizationColor(utilization) + '.main' }}>
                              {member.userName.charAt(0).toUpperCase()}
                            </Avatar>
                            {member.userName}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatHours(member.totalAllocatedHours)}</TableCell>
                        <TableCell align="right">{formatHours(member.totalActualHours)}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${utilization.toFixed(0)}%`}
                            color={getUtilizationColor(utilization)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${variance >= 0 ? '+' : ''}${formatHours(variance)}`}
                            color={variance > 0 ? 'warning' : variance < 0 ? 'info' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {utilization > 120 ? (
                            <Chip label="Overloaded" color="error" size="small" />
                          ) : utilization > 100 ? (
                            <Chip label="Over capacity" color="warning" size="small" />
                          ) : utilization > 80 ? (
                            <Chip label="Optimal" color="success" size="small" />
                          ) : utilization > 60 ? (
                            <Chip label="Good" color="info" size="small" />
                          ) : (
                            <Chip label="Available" color="default" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};