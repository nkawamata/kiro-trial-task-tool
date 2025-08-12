import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  WorkOutline as WorkloadIcon,
  Person as PersonIcon,
  Group as TeamIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { RootState, AppDispatch } from '../store';
import { fetchWorkloadSummary, fetchWorkloadDistribution, fetchTeamWorkload, fetchWorkloadEntries } from '../store/slices/workloadSlice';
import { fetchProjects } from '../store/slices/projectsSlice';
import { WorkloadCalendar, WorkloadAllocationDialog, WorkloadChart } from '../components/workload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workload-tabpanel-${index}`}
      aria-labelledby={`workload-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const WorkloadView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { summary, distribution, teamWorkload, loading, error } = useSelector((state: RootState) => state.workload);
  const { projects } = useSelector((state: RootState) => state.projects);

  const [tabValue, setTabValue] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRange) {
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  }, [dateRange]);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchWorkloadDistribution());
    
    const { startDate, endDate } = getDateRange();
    dispatch(fetchWorkloadSummary({ startDate, endDate }));
  }, [dispatch, dateRange]);

  useEffect(() => {
    if (selectedProject !== 'all') {
      const { startDate, endDate } = getDateRange();
      dispatch(fetchTeamWorkload({ projectId: selectedProject, startDate, endDate }));
    }
  }, [dispatch, selectedProject, dateRange]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'info';
    return 'success';
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  if (loading && !summary && !distribution) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkloadIcon />
          <Typography variant="h4" component="h1">
            Workload Management
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAllocationDialogOpen(true)}
          >
            Allocate Work
          </Button>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={dateRange}
              label="Time Range"
              onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'quarter')}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="quarter">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<PersonIcon />} label="My Workload" />
          <Tab icon={<CalendarIcon />} label="Calendar View" />
          <Tab icon={<TeamIcon />} label="Team Capacity" />
          <Tab icon={<TrendingUpIcon />} label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Personal Workload Summary */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon />
                  Capacity Overview
                </Typography>
                {distribution ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Weekly Capacity: {distribution.totalCapacity}h
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(distribution.allocated / distribution.totalCapacity) * 100}
                        color={getCapacityColor((distribution.allocated / distribution.totalCapacity) * 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption">
                          Allocated: {formatHours(distribution.allocated)}
                        </Typography>
                        <Typography variant="caption">
                          Available: {formatHours(distribution.available)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`${((distribution.allocated / distribution.totalCapacity) * 100).toFixed(0)}% Utilized`}
                        color={getCapacityColor((distribution.allocated / distribution.totalCapacity) * 100)}
                        size="small"
                      />
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary">Loading capacity data...</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Project Distribution */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Distribution
                </Typography>
                {distribution && distribution.projects.length > 0 ? (
                  <Box>
                    {distribution.projects.map((project: any) => (
                      <Box key={project.projectId} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {project.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatHours(project.hours)} ({project.percentage.toFixed(0)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={project.percentage}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No project allocations found for the selected period.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Summary
                </Typography>
                {summary ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Project</TableCell>
                          <TableCell align="right">Allocated Hours</TableCell>
                          <TableCell align="right">Actual Hours</TableCell>
                          <TableCell align="right">Variance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summary.projects.map((project) => {
                          const variance = project.actualHours - project.allocatedHours;
                          return (
                            <TableRow key={project.projectId}>
                              <TableCell>{project.projectName}</TableCell>
                              <TableCell align="right">{formatHours(project.allocatedHours)}</TableCell>
                              <TableCell align="right">{formatHours(project.actualHours)}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${variance >= 0 ? '+' : ''}${formatHours(variance)}`}
                                  color={variance > 0 ? 'warning' : variance < 0 ? 'info' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatHours(summary.totalAllocatedHours)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatHours(summary.totalActualHours)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${summary.totalActualHours - summary.totalAllocatedHours >= 0 ? '+' : ''}${formatHours(summary.totalActualHours - summary.totalAllocatedHours)}`}
                              color={summary.totalActualHours > summary.totalAllocatedHours ? 'warning' : 'info'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    No workload data available for the selected period.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <WorkloadCalendar />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Filter
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Select Project</InputLabel>
                  <Select
                    value={selectedProject}
                    label="Select Project"
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <MenuItem value="all">All Projects</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Workload
                </Typography>
                {selectedProject === 'all' ? (
                  <Typography color="text.secondary">
                    Please select a specific project to view team workload.
                  </Typography>
                ) : teamWorkload.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Team Member</TableCell>
                          <TableCell align="right">Allocated Hours</TableCell>
                          <TableCell align="right">Actual Hours</TableCell>
                          <TableCell align="right">Utilization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {teamWorkload.map((member) => {
                          const utilization = member.totalAllocatedHours > 0 
                            ? (member.totalActualHours / member.totalAllocatedHours) * 100 
                            : 0;
                          return (
                            <TableRow key={member.userId}>
                              <TableCell>{member.userName}</TableCell>
                              <TableCell align="right">{formatHours(member.totalAllocatedHours)}</TableCell>
                              <TableCell align="right">{formatHours(member.totalActualHours)}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${utilization.toFixed(0)}%`}
                                  color={getCapacityColor(utilization)}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    No team workload data available for the selected project and period.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <WorkloadChart summary={summary} distribution={distribution} />
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="primary">
                        {summary ? summary.projects.length : 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Projects
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="secondary">
                        {summary ? formatHours(summary.totalAllocatedHours) : '0h'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Allocated
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="info.main">
                        {summary ? formatHours(summary.totalActualHours) : '0h'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Actual
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="warning.main">
                        {summary && summary.totalAllocatedHours > 0 
                          ? `${((summary.totalActualHours / summary.totalAllocatedHours) * 100).toFixed(0)}%`
                          : '0%'
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Efficiency
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <WorkloadAllocationDialog
        open={allocationDialogOpen}
        onClose={() => setAllocationDialogOpen(false)}
        onSuccess={() => {
          // Refresh workload data
          dispatch(fetchWorkloadDistribution());
          const { startDate, endDate } = getDateRange();
          dispatch(fetchWorkloadSummary({ startDate, endDate }));
        }}
      />
    </Box>
  );
};