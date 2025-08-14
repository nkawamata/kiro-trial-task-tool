import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Chip,
  Divider
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Home as HomeIcon,
  TrendingUp as WorkloadIcon,
  People as TeamIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProjectTasks } from '../store/slices/tasksSlice';
import { fetchProjects } from '../store/slices/projectsSlice';
import { fetchProjectMembers } from '../store/slices/teamSlice';
import { useTaskWorkloadIntegration } from '../hooks/useTaskWorkloadIntegration';
import { WorkloadAwareAssigneeSelector } from '../components/tasks/WorkloadAwareAssigneeSelector';
import { WorkloadImpactPreview } from '../components/workload/WorkloadImpactPreview';
import { CapacityIndicator } from '../components/workload/CapacityIndicator';
import { taskWorkloadService, WorkloadDistributionStrategy } from '../services/taskWorkloadService';

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
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const TaskWorkloadIntegrationDemo: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { projects } = useSelector((state: RootState) => state.projects);
  const { members } = useSelector((state: RootState) => state.team);

  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [assignmentResult, setAssignmentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const task = tasks.find(t => t.id === taskId);
  const project = task ? projects.find(p => p.id === task.projectId) : null;
  const projectMembers = task ? (members[task.projectId] || []) : [];

  const {
    suggestions,
    workloadImpact,
    capacities,
    teamOverview,
    loading,
    error: integrationError,
    assignTaskWithWorkload,
    validateAssignment,
    getOptimalAssignees
  } = useTaskWorkloadIntegration({
    taskId,
    assigneeId: selectedAssignee,
    projectMembers: projectMembers.map(pm => pm.userId),
    autoLoadSuggestions: true,
    autoLoadImpact: true
  });

  useEffect(() => {
    dispatch(fetchProjects());
    if (taskId) {
      // Find the task first to get project ID
      const foundTask = tasks.find(t => t.id === taskId);
      if (foundTask) {
        dispatch(fetchProjectMembers(foundTask.projectId));
      }
    }
  }, [dispatch, taskId, tasks]);

  useEffect(() => {
    if (task) {
      dispatch(fetchProjectTasks(task.projectId));
      dispatch(fetchProjectMembers(task.projectId));
    }
  }, [dispatch, task]);

  const handleAssignWithWorkload = async () => {
    if (!selectedAssignee || !taskId) return;

    try {
      setError('');
      const result = await assignTaskWithWorkload(selectedAssignee, {
        distributionStrategy: WorkloadDistributionStrategy.EVEN,
        autoAllocate: true
      });
      setAssignmentResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to assign task with workload');
    }
  };

  const handleValidateAssignment = async () => {
    if (!selectedAssignee || !taskId) return;

    try {
      const validation = await validateAssignment(selectedAssignee);
      console.log('Assignment validation:', validation);
      
      if (validation.warnings.length > 0) {
        setError(`Warnings: ${validation.warnings.join(', ')}`);
      } else {
        setError('Assignment validation passed!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate assignment');
    }
  };

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Task not found. Please check the task ID and try again.
        </Alert>
        <Button onClick={() => navigate('/tasks')} sx={{ mt: 2 }}>
          Back to Tasks
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <HomeIcon fontSize="small" />
          Home
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/tasks')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <TaskIcon fontSize="small" />
          Tasks
        </Link>
        <Typography color="text.primary">
          Task-Workload Integration Demo
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Task-Workload Integration Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Demonstrating the integration between task assignment and workload management
        </Typography>
        
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {task.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip label={project?.name || 'Unknown Project'} size="small" />
              <Chip label={task.status} size="small" color="primary" />
              <Chip label={task.priority} size="small" color="secondary" />
            </Box>
            {task.estimatedHours && (
              <Typography variant="body2" color="text.secondary">
                Estimated: {task.estimatedHours} hours
              </Typography>
            )}
            {task.startDate && task.endDate && (
              <Typography variant="body2" color="text.secondary">
                Timeline: {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Error Display */}
      {(error || integrationError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || integrationError}
        </Alert>
      )}

      {/* Assignment Result */}
      {assignmentResult && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Task assigned successfully! Created {assignmentResult.workloadEntries?.length || 0} workload entries.
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="Assignment" icon={<TaskIcon />} />
          <Tab label="Workload Impact" icon={<WorkloadIcon />} />
          <Tab label="Team Capacity" icon={<TeamIcon />} />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Smart Assignment
                </Typography>
                <WorkloadAwareAssigneeSelector
                  value={selectedAssignee}
                  onChange={(userId) => setSelectedAssignee(userId || '')}
                  projectMembers={projectMembers}
                  taskId={taskId}
                  showSuggestions={true}
                  showWorkloadImpact={false}
                />
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleAssignWithWorkload}
                    disabled={!selectedAssignee || loading}
                  >
                    Assign with Workload
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleValidateAssignment}
                    disabled={!selectedAssignee || loading}
                  >
                    Validate Assignment
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assignment Suggestions
                </Typography>
                {suggestions.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <Box
                        key={suggestion.userId}
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => setSelectedAssignee(suggestion.userId)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2">
                            {suggestion.userName}
                          </Typography>
                          <Chip
                            label={`Score: ${Math.round(suggestion.recommendationScore)}`}
                            size="small"
                            color="primary"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {suggestion.reason}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Utilization: {Math.round(suggestion.utilizationRate * 100)}% | 
                          Available: {suggestion.availableCapacity}h
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No suggestions available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {selectedAssignee ? (
              <WorkloadImpactPreview
                taskId={taskId!}
                assigneeId={selectedAssignee}
              />
            ) : (
              <Alert severity="info">
                Select an assignee to see workload impact analysis
              </Alert>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <Grid container spacing={3}>
          {capacities.map((capacity) => (
            <Grid item xs={12} sm={6} md={4} key={capacity.userId}>
              <Card>
                <CardContent>
                  <CapacityIndicator
                    userId={capacity.userId}
                    userName={capacity.userName}
                    showDetails={true}
                    size="medium"
                    variant="detailed"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {capacities.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                No team capacity data available
              </Alert>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Overview
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Members:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {teamOverview.totalMembers}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Over-allocated:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="error.main">
                      {teamOverview.overAllocatedMembers}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Average Utilization:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {Math.round(teamOverview.averageUtilization * 100)}%
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Capacity:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {teamOverview.totalCapacity}h
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Allocated:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {teamOverview.totalAllocated}h
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Available:</Typography>
                    <Typography variant="body2" fontWeight="medium" color="success.main">
                      {teamOverview.totalAvailable}h
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Integration Features
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    ✅ Smart assignment suggestions based on workload
                  </Typography>
                  <Typography variant="body2">
                    ✅ Real-time workload impact preview
                  </Typography>
                  <Typography variant="body2">
                    ✅ Capacity-aware assignee selection
                  </Typography>
                  <Typography variant="body2">
                    ✅ Automatic workload allocation on assignment
                  </Typography>
                  <Typography variant="body2">
                    ✅ Over-allocation warnings and validation
                  </Typography>
                  <Typography variant="body2">
                    ✅ Team capacity overview and analytics
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};